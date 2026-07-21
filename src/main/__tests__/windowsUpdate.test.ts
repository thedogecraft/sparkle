import { describe, it, expect } from "vitest"
import {
  buildSearchScript,
  buildInstallScript,
  parseSearchOutput,
  UPDATE_ID_PATTERN,
} from "@main/windowsUpdate"

describe("buildSearchScript", () => {
  it("forces public Windows Update, bypassing any WSUS redirect", () => {
    const script = buildSearchScript("Driver")
    expect(script).toContain("$searcher.ServerSelection = 2")
    expect(script).toContain('$searcher.ServiceID = "7971f918-a847-4430-9279-4a52d1efe18d"')
    expect(script).toContain("IsInstalled=0 and Type='Driver'")
  })

  it("switches the search filter for Software", () => {
    expect(buildSearchScript("Software")).toContain("IsInstalled=0 and Type='Software'")
  })
})

describe("parseSearchOutput", () => {
  it("parses a real ConvertTo-Json shaped payload with multiple items", () => {
    const raw = JSON.stringify({
      items: [
        { updateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", title: "Intel Graphics Driver", kb: "", type: "Driver", sizeBytes: 12345, driverProvider: "Intel", driverClass: "Display", driverVerDate: "2026-04-16" },
      ],
    })
    const { items, error } = parseSearchOutput(raw)
    expect(error).toBeUndefined()
    expect(items).toHaveLength(1)
    expect(items[0].driverProvider).toBe("Intel")
  })

  it("handles the single-item case where PowerShell doesn't wrap items in an array", () => {
    // PSCustomObject wrapping keeps `items` an array even for one row, but
    // guard the parser against the classic PS ConvertTo-Json collapse anyway.
    const raw = JSON.stringify({ items: { updateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", title: "Solo update" } })
    const { items } = parseSearchOutput(raw)
    expect(items).toHaveLength(1)
  })

  it("returns an empty list for zero updates", () => {
    expect(parseSearchOutput(JSON.stringify({ items: [] }))).toEqual({ items: [], error: undefined })
  })

  it("surfaces a COM error captured by the script's catch block", () => {
    const raw = JSON.stringify({ items: [], error: "0x8024402C" })
    const { items, error } = parseSearchOutput(raw)
    expect(items).toEqual([])
    expect(error).toBe("0x8024402C")
  })

  it("finds the JSON even with COM warning noise printed above it", () => {
    const raw = "WARNING: Some COM diagnostic text\n" + JSON.stringify({ items: [] })
    const { items } = parseSearchOutput(raw)
    expect(items).toEqual([])
  })

  it("returns an empty list rather than throwing on garbage input", () => {
    expect(parseSearchOutput("not json at all").items).toEqual([])
    expect(parseSearchOutput("").items).toEqual([])
  })
})

describe("buildInstallScript", () => {
  it("interpolates valid GUIDs into the id array", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    const script = buildInstallScript([id])
    expect(script).toContain(`$ids = @("${id}")`)
  })

  it("drops ids that aren't well-formed GUIDs before they reach the script", () => {
    const good = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    const script = buildInstallScript([good, "'; Remove-Item C:\\ -Recurse; $x = '", "not-a-guid"])
    expect(script).toContain(`$ids = @("${good}")`)
    expect(script).not.toContain("Remove-Item")
  })

  it("never forces a restart -- reboot detection is left to the existing power menu", () => {
    const script = buildInstallScript(["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"])
    expect(script).not.toMatch(/Restart-Computer|shutdown\s+\/r/i)
  })

  it("does not prompt for install media", () => {
    expect(buildInstallScript(["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"])).toContain(
      "$installer.AllowSourcePrompts = $false",
    )
  })
})

describe("UPDATE_ID_PATTERN", () => {
  it("accepts real WU UpdateID GUIDs and rejects everything else", () => {
    expect(UPDATE_ID_PATTERN.test("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(true)
    expect(UPDATE_ID_PATTERN.test("not-a-guid")).toBe(false)
    expect(UPDATE_ID_PATTERN.test("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee; Remove-Item")).toBe(false)
  })
})
