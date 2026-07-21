import { describe, it, expect } from "vitest"
import { parseChocoOutdatedOutput, buildOutdatedScript, buildChocoUpgradeScript, SAFE_CHOCO_ID } from "@main/chocoUpgrade"

describe("parseChocoOutdatedOutput", () => {
  it("parses choco outdated -r's documented pipe-delimited format", () => {
    const raw = "git|2.40.0|2.43.0|false\n7zip|22.01|23.01|false\n"
    const updates = parseChocoOutdatedOutput(raw)
    expect(updates).toEqual([
      { id: "7zip", name: "7zip", currentVersion: "22.01", availableVersion: "23.01", source: "chocolatey" },
      { id: "git", name: "git", currentVersion: "2.40.0", availableVersion: "2.43.0", source: "chocolatey" },
    ])
  })

  it("excludes pinned packages", () => {
    const raw = "git|2.40.0|2.43.0|true\n7zip|22.01|23.01|false\n"
    const updates = parseChocoOutdatedOutput(raw)
    expect(updates.map((u) => u.id)).toEqual(["7zip"])
  })

  it("drops rows with no available version or unchanged version", () => {
    const raw = "broken|1.0||false\nunchanged|1.0|1.0|false\nreal|1.0|1.1|false\n"
    expect(parseChocoOutdatedOutput(raw).map((u) => u.id)).toEqual(["real"])
  })

  it("returns [] for empty output or the 'nothing outdated' case", () => {
    expect(parseChocoOutdatedOutput("")).toEqual([])
    expect(parseChocoOutdatedOutput("Chocolatey has determined 0 package(s) are outdated.")).toEqual([])
  })

  it("ignores banner/header noise lines that don't contain a pipe", () => {
    const raw = [
      "Chocolatey v2.3.0",
      "Outdated Packages",
      " Output is package name | current version | available version | pinned?",
      "",
      "git|2.40.0|2.43.0|false",
      "",
      "Chocolatey has determined 1 package(s) are outdated.",
    ].join("\n")
    expect(parseChocoOutdatedOutput(raw).map((u) => u.id)).toEqual(["git"])
  })
})

describe("buildOutdatedScript", () => {
  it("uses the machine-readable -r flag", () => {
    expect(buildOutdatedScript()).toContain("choco outdated -r")
  })
})

describe("buildChocoUpgradeScript", () => {
  it("propagates the real exit code and quotes the id", () => {
    const script = buildChocoUpgradeScript("git")
    expect(script).toContain('choco upgrade "git" -y')
    expect(script.trim().endsWith("exit $LASTEXITCODE")).toBe(true)
  })
})

describe("SAFE_CHOCO_ID", () => {
  it("rejects ids that could break out of the PowerShell string", () => {
    expect(SAFE_CHOCO_ID.test('git"; Remove-Item C:\\')).toBe(false)
    expect(SAFE_CHOCO_ID.test("git")).toBe(true)
  })
})
