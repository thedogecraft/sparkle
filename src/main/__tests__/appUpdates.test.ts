import { describe, it, expect } from "vitest"
import {
  parseWingetUpgradeOutput,
  buildUpgradeScript,
  buildUpgradeListScript,
  orderUpgradeTargets,
  SAFE_WINGET_ID,
} from "@main/wingetUpgrade"

// Captured verbatim from `winget upgrade --accept-source-agreements
// --disable-interactivity` on a real Windows 11 25H2 machine, including the
// leading BOM that PowerShell's UTF-8 output emits.
const REAL_OUTPUT = `﻿Name                                                               Id                                     Version            Available          Source
------------------------------------------------------------------------------------------------------------------------------------------------------
Adobe Creative Cloud                                               Adobe.CreativeCloud                    6.9.1.1            6.10.0.252.3       winget
Audacity 3.7.7                                                     Audacity.Audacity                      3.7.7              3.7.8              winget
Bambu Studio                                                       Bambulab.Bambustudio                   02.05.00.66        02.07.01.62        winget
Cursor (User)                                                      Anysphere.Cursor                       3.8.22             3.11.19            winget
Git                                                                Git.Git                                2.53.0             2.55.0.3           winget
GitHub Desktop                                                     GitHub.GitHubDesktop                   3.5.8              3.6.3              winget
Google Chrome                                                      Google.Chrome.EXE                      150.0.7871.116     150.0.7871.129     winget
Hytale Launcher                                                    HypixelStudios.Hytale                  2026.01.29-a86a538 2026.07.07-325d709 winget
Java 8 Update 471 (64-bit)                                         Oracle.JavaRuntimeEnvironment          8.0.4710.9         8.0.4910.10        winget
Microsoft OneDrive                                                 Microsoft.OneDrive                     26.108.0607.0002   26.113.0614.0004   winget
Microsoft Visual C++ 2013 Redistributable (x64) - 12.0.40649       Microsoft.VCRedist.2013.x64            12.0.40649.5       12.0.40664.0       winget
Microsoft Visual C++ 2015-2022 Redistributable (x64) - 14.44.35211 Microsoft.VCRedist.2015+.x64           14.44.35211.0      14.51.36247.0      winget
Microsoft Visual C++ 2015-2022 Redistributable (x86) - 14.44.35211 Microsoft.VCRedist.2015+.x86           14.44.35211.0      14.51.36247.0      winget
MuseScore Studio 4                                                 Musescore.Musescore                    4.6.3.252940956    4.7.4.260706075    winget
Tailscale                                                          Tailscale.Tailscale                    1.94.2             1.98.9             winget
VLC media player                                                   VideoLAN.VLC                           3.0.20             3.0.23             winget
Windows 11 Installation Assistant                                  Microsoft.WindowsInstallationAssistant 1.4.19041.5003     1.4.19041.6448     winget
Windows Subsystem for Linux                                        Microsoft.WSL                          2.6.3.0            2.7.10             winget
18 upgrades available.
`

// Builds a table padded the way winget pads: every column is widened to fit
// its longest value. Hand-aligning these by eye produces fixtures that don't
// match real output and test nothing.
type Row = [name: string, id: string, version: string, available: string, source: string]
function makeTable(rows: Row[], footers: string[] = []): string {
  const headers = ["Name", "Id", "Version", "Available", "Source"]
  const widths = headers.map(
    (h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)) + 2,
  )
  const fmt = (cells: readonly string[]): string =>
    cells.map((c, i) => (i === cells.length - 1 ? c : c.padEnd(widths[i]))).join("")
  const header = fmt(headers)
  return [header, "-".repeat(header.length), ...rows.map(fmt), ...footers].join("\n") + "\n"
}

describe("parseWingetUpgradeOutput", () => {
  it("parses real winget output into every row", () => {
    const updates = parseWingetUpgradeOutput(REAL_OUTPUT)
    expect(updates).toHaveLength(18)
  })

  it("extracts fields exactly, including ids containing + and versions with dashes", () => {
    const updates = parseWingetUpgradeOutput(REAL_OUTPUT)
    const byId = Object.fromEntries(updates.map((u) => [u.id, u]))

    expect(byId["Adobe.CreativeCloud"]).toMatchObject({
      name: "Adobe Creative Cloud",
      currentVersion: "6.9.1.1",
      availableVersion: "6.10.0.252.3",
      source: "winget",
      truncated: false,
    })
    // "+" in the id must survive both parsing and the SAFE_WINGET_ID gate.
    expect(byId["Microsoft.VCRedist.2015+.x64"]).toMatchObject({
      currentVersion: "14.44.35211.0",
      availableVersion: "14.51.36247.0",
    })
    // Dashed date-style versions must not be mistaken for column padding.
    expect(byId["HypixelStudios.Hytale"]).toMatchObject({
      currentVersion: "2026.01.29-a86a538",
      availableVersion: "2026.07.07-325d709",
    })
  })

  it("sorts alphabetically by name, case-insensitively", () => {
    const names = parseWingetUpgradeOutput(REAL_OUTPUT).map((u) => u.name)
    expect(names[0]).toBe("Adobe Creative Cloud")
    expect(names[names.length - 1]).toBe("Windows Subsystem for Linux")
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })))
  })

  it("does not parse the '18 upgrades available.' footer as a row", () => {
    const updates = parseWingetUpgradeOutput(REAL_OUTPUT)
    expect(updates.some((u) => /upgrades? available/i.test(u.name))).toBe(false)
  })

  it("returns [] when nothing is upgradable", () => {
    expect(parseWingetUpgradeOutput("No installed package found matching input criteria.")).toEqual([])
    expect(parseWingetUpgradeOutput("")).toEqual([])
  })

  it("ignores the unknown-version and pinned footers", () => {
    const out = makeTable(
      [["VLC media player", "VideoLAN.VLC", "3.0.20", "3.0.23", "winget"]],
      [
        "1 upgrades available.",
        "2 package(s) have version numbers that cannot be determined. Use --include-unknown to see all results.",
        "1 package(s) have pins that prevent upgrade. Use --include-pinned to see all results.",
      ],
    )
    const updates = parseWingetUpgradeOutput(out)
    expect(updates).toHaveLength(1)
    expect(updates[0].id).toBe("VideoLAN.VLC")
  })

  it("stops before the 'require explicit targeting' second table", () => {
    const first = makeTable(
      [["VLC media player", "VideoLAN.VLC", "3.0.20", "3.0.23", "winget"]],
      [
        "1 upgrades available.",
        "The following packages have an upgrade available, but require explicit targeting for upgrade:",
      ],
    )
    const second = makeTable([["Weird App", "Weird.App", "1.0", "2.0", "winget"]])
    const updates = parseWingetUpgradeOutput(first + second)
    expect(updates).toHaveLength(1)
    expect(updates.some((u) => u.id === "Weird.App")).toBe(false)
  })

  it("flags truncated ids and strips the ellipsis", () => {
    const out = makeTable([
      ["Visual Studio Community 2022", "Microsoft.VisualStudio.2022.Communit…", "17.9.0", "17.10.0", "winget"],
    ])
    const updates = parseWingetUpgradeOutput(out)
    expect(updates[0].id).toBe("Microsoft.VisualStudio.2022.Communit")
    expect(updates[0].truncated).toBe(true)
  })

  it("recovers rows whose columns are shifted by wide CJK glyphs", () => {
    // The name's double-width glyphs push later columns past their header
    // offsets, so the fixed-width slice yields garbage and the right-anchored
    // fallback has to take over.
    const out = `Name                Id            Version   Available   Source
------------------------------------------------------------
腾讯QQ会员超级会员    Tencent.QQ    9.7.1     9.7.3       winget
`
    const updates = parseWingetUpgradeOutput(out)
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({
      id: "Tencent.QQ",
      currentVersion: "9.7.1",
      availableVersion: "9.7.3",
      source: "winget",
    })
  })

  it("drops rows with Unknown or unchanged available versions", () => {
    const out = makeTable([
      ["App A", "Vendor.AppA", "1.0", "Unknown", "winget"],
      ["App B", "Vendor.AppB", "2.0", "2.0", "winget"],
      ["App C", "Vendor.AppC", "3.0", "3.1", "winget"],
    ])
    const updates = parseWingetUpgradeOutput(out)
    expect(updates.map((u) => u.id)).toEqual(["Vendor.AppC"])
  })

  it("survives CRLF line endings and ANSI/backspace progress noise", () => {
    const table = makeTable([["VLC media player", "VideoLAN.VLC", "3.0.20", "3.0.23", "winget"]])
    const noise = "\x1b[?25l\b\b-\\|/\x1b[?25h"
    const out = noise + "\r\n" + table.replace(/\n/g, "\r\n")
    const updates = parseWingetUpgradeOutput(out)
    expect(updates).toHaveLength(1)
    expect(updates[0].id).toBe("VideoLAN.VLC")
  })
})

describe("buildUpgradeListScript", () => {
  it("forces UTF-8 and exits 0 so benign non-zero winget codes don't discard stdout", () => {
    const script = buildUpgradeListScript()
    expect(script).toContain("[Console]::OutputEncoding = [System.Text.Encoding]::UTF8")
    expect(script).toContain("winget upgrade --accept-source-agreements --disable-interactivity")
    expect(script.trim().endsWith("exit 0")).toBe(true)
    expect(script).not.toContain("--include-unknown")
  })
})

describe("buildUpgradeScript", () => {
  it("uses --exact for a normal id and propagates the real exit code", () => {
    const script = buildUpgradeScript({ id: "VideoLAN.VLC", source: "winget" })
    expect(script).toContain('winget upgrade --id "VideoLAN.VLC" --exact --source winget --silent')
    expect(script).toContain("--accept-package-agreements")
    expect(script.trim().endsWith("exit $LASTEXITCODE")).toBe(true)
  })

  it("omits --exact for a truncated id so substring matching can resolve it", () => {
    const script = buildUpgradeScript({ id: "Microsoft.VisualStudio.2022.Communit", truncated: true })
    expect(script).not.toContain("--exact")
    expect(script).toContain('--id "Microsoft.VisualStudio.2022.Communit"')
  })

  it("only passes through known sources", () => {
    expect(buildUpgradeScript({ id: "Some.App", source: "msstore" })).toContain("--source msstore")
    // An unexpected source value must never reach the command line.
    expect(buildUpgradeScript({ id: "Some.App", source: "evil; rm -rf /" })).not.toContain("--source")
  })
})

describe("SAFE_WINGET_ID", () => {
  it("accepts real winget ids", () => {
    for (const id of [
      "VideoLAN.VLC",
      "Microsoft.VCRedist.2015+.x64",
      "Google.Chrome.EXE",
      "Microsoft.WSL",
      "7zip.7zip",
    ]) {
      expect(SAFE_WINGET_ID.test(id)).toBe(true)
    }
  })

  it("rejects ids that could break out of the PowerShell string", () => {
    for (const id of [
      'foo"; Remove-Item C:\\ -Recurse',
      "foo`whoami`",
      "foo$(whoami)",
      "foo bar",
      "foo;bar",
      "foo|bar",
      "",
      ".leadingDot",
    ]) {
      expect(SAFE_WINGET_ID.test(id)).toBe(false)
    }
  })
})

describe("orderUpgradeTargets", () => {
  it("moves winget's own package last so it can't kill the rest of the batch", () => {
    const targets = [
      { id: "Microsoft.DesktopAppInstaller" },
      { id: "VideoLAN.VLC" },
      { id: "Git.Git" },
    ]
    expect(orderUpgradeTargets(targets).map((t) => t.id)).toEqual([
      "VideoLAN.VLC",
      "Git.Git",
      "Microsoft.DesktopAppInstaller",
    ])
  })

  it("preserves order when winget itself isn't in the batch", () => {
    const targets = [{ id: "VideoLAN.VLC" }, { id: "Git.Git" }]
    expect(orderUpgradeTargets(targets).map((t) => t.id)).toEqual(["VideoLAN.VLC", "Git.Git"])
  })
})
