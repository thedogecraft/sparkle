import type { AppUpdate } from "../types"

// Winget package ids are dot/dash-separated alphanumerics. Anything outside
// this set is rejected before being interpolated into a PowerShell script,
// since these scripts run elevated.
export const SAFE_WINGET_ID = /^[A-Za-z0-9][A-Za-z0-9.+_-]*$/

const ELLIPSIS = "…"

// Lines that mark the end of the parseable upgrade table. Winget prints these
// footers (and sometimes a second "explicit targeting" table) after the rows.
const STOP_PATTERNS = [
  /^\d+\s+upgrades?\s+available/i,
  /require explicit targeting/i,
  /cannot be determined/i,
  /pins that prevent upgrade/i,
]

export function buildUpgradeListScript(): string {
  // UTF-8 output is required so the … truncation marker and non-ASCII app
  // names survive the console. `exit 0` because winget uses non-zero exit
  // codes for benign outcomes ("nothing to upgrade") and executePowerShell
  // would reject and discard stdout; the parser decides what the output means.
  return [
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "winget upgrade --accept-source-agreements --disable-interactivity",
    "exit 0",
  ].join("\n")
}

export function buildUpgradeScript(target: {
  id: string
  source?: string
  truncated?: boolean
}): string {
  const args = ["winget", "upgrade", "--id", `"${target.id}"`]
  // A truncated id is a prefix, not the real id — winget's substring matching
  // resolves it, but --exact would fail to match anything.
  if (!target.truncated) args.push("--exact")
  if (target.source === "winget" || target.source === "msstore") {
    args.push("--source", target.source)
  }
  args.push(
    "--silent",
    "--accept-package-agreements",
    "--accept-source-agreements",
    "--disable-interactivity",
  )
  return [
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    args.join(" "),
    "exit $LASTEXITCODE",
  ].join("\n")
}

// Upgrading App Installer replaces winget.exe itself mid-batch, which kills
// any upgrades still queued behind it — so it always goes last.
export function orderUpgradeTargets<T extends { id: string }>(targets: T[]): T[] {
  const isWingetItself = (t: T): boolean =>
    /^Microsoft\.(DesktopAppInstaller|AppInstaller)$/i.test(t.id)
  return [...targets.filter((t) => !isWingetItself(t)), ...targets.filter(isWingetItself)]
}

export function parseWingetUpgradeOutput(raw: string): AppUpdate[] {
  const lines = raw
    .replace(/\uFEFF/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x08\r]/g, "")
    .split("\n")

  // Find the header row: "Name", "Id", "Version", "Available", "Source" in
  // order. Progress-spinner junk before it is ignored by construction.
  let headerIdx = -1
  let idxName = 0
  let idxId = 0
  let idxVersion = 0
  let idxAvailable = 0
  let idxSource = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const n = line.indexOf("Name")
    if (n === -1) continue
    const id = line.indexOf("Id", n + 4)
    if (id === -1) continue
    const v = line.indexOf("Version", id + 2)
    if (v === -1) continue
    const a = line.indexOf("Available", v + 7)
    if (a === -1) continue
    const s = line.indexOf("Source", a + 9)
    if (s === -1) continue
    headerIdx = i
    idxName = n
    idxId = id
    idxVersion = v
    idxAvailable = a
    idxSource = s
    break
  }
  if (headerIdx === -1) return []

  // The line after the header must be the ----- separator.
  let rowStart = headerIdx + 1
  while (rowStart < lines.length && lines[rowStart].trim() === "") rowStart++
  if (rowStart >= lines.length || !/^-{5,}/.test(lines[rowStart].trim())) return []
  rowStart++

  const updates: AppUpdate[] = []
  for (let i = rowStart; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === "") break
    if (STOP_PATTERNS.some((p) => p.test(trimmed))) break

    // Fixed-width slice by header column offsets.
    let name = line.slice(idxName, idxId).trim()
    let id = line.slice(idxId, idxVersion).trim()
    let currentVersion = line.slice(idxVersion, idxAvailable).trim()
    let availableVersion = line.slice(idxAvailable, idxSource).trim()
    let source = line.slice(idxSource).trim()

    // Wide glyphs (CJK, emoji) occupy two console columns but one JS index,
    // shifting everything right of the name. Ids and versions never contain
    // spaces, so a right-anchored token parse recovers the row.
    if (id === "" || /\s/.test(id) || availableVersion === "") {
      const tokens = trimmed.split(/\s+/)
      if (tokens.length < 5) continue
      source = tokens.pop() as string
      availableVersion = tokens.pop() as string
      currentVersion = tokens.pop() as string
      id = tokens.pop() as string
      name = tokens.join(" ")
    }

    let truncated = false
    if (id.endsWith(ELLIPSIS)) {
      truncated = true
      id = id.slice(0, -1)
    }

    if (!id || !availableVersion) continue
    if (availableVersion === "Unknown" || availableVersion === currentVersion) continue

    updates.push({ id, name, currentVersion, availableVersion, source, truncated })
  }

  return updates.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}
