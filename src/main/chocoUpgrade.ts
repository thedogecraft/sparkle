import type { AppUpdate } from "../types"
import { SAFE_WINGET_ID } from "@main/wingetUpgrade"

// choco outdated's `-r` (limit-output) flag is Chocolatey's own
// purpose-built machine-readable mode: strict `name|current|available|pinned`
// lines with no header/footer noise, documented at
// https://docs.chocolatey.org/en-us/choco/commands/outdated. Far more stable
// than scraping the human-readable table the way winget's output requires.
//
// NOTE: unlike the winget parser (tested against real captured output) and
// the Windows Update / Nvidia lookups (tested live), this has not been
// exercised against a real Chocolatey install -- verified only against
// Chocolatey's documented `-r` format, not empirically. Flagging this since
// it's the one piece of this feature that couldn't be proven on real data.

// Chocolatey package ids follow the same safe charset winget ids do.
export const SAFE_CHOCO_ID = SAFE_WINGET_ID

export function buildOutdatedScript(): string {
  return [
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "choco outdated -r --accept-license",
    "exit 0",
  ].join("\n")
}

export function buildChocoUpgradeScript(id: string): string {
  return [
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    `choco upgrade "${id}" -y --accept-license`,
    "exit $LASTEXITCODE",
  ].join("\n")
}

export function parseChocoOutdatedOutput(raw: string): AppUpdate[] {
  const updates: AppUpdate[] = []
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim()
    if (!line || !line.includes("|")) continue

    const parts = line.split("|")
    if (parts.length < 3) continue

    const [id, currentVersion, availableVersion, pinned] = parts
    if (!id || !availableVersion) continue
    // Real Chocolatey ids never contain whitespace; this is what tells a
    // data row apart from the human-readable column-header comment line
    // (" Output is package name | current version | ..."), which also
    // contains pipes and four fields.
    if (/\s/.test(id.trim())) continue
    if (availableVersion === currentVersion) continue
    // Respect an explicitly pinned package the same way winget's parser
    // respects a pin footer -- the user asked Chocolatey not to touch it.
    if (pinned?.trim().toLowerCase() === "true") continue

    updates.push({
      id: id.trim(),
      name: id.trim(),
      currentVersion: currentVersion.trim(),
      availableVersion: availableVersion.trim(),
      source: "chocolatey",
    })
  }
  return updates.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}
