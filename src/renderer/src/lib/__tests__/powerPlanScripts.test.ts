import { describe, it, expect } from "vitest"
import fs from "fs"
import { applyUltimatePerformanceScript, powerPlanCheckScript } from "@/lib/powerPlanScripts"

describe("power plan scripts", () => {
  it("detects plans by GUID instead of localized display names", () => {
    expect(powerPlanCheckScript).toContain("powercfg /getactivescheme")
    expect(powerPlanCheckScript).toMatch(/\[0-9a-fA-F\]\{8\}/)
    expect(powerPlanCheckScript).toContain("381b4222-f694-41f0-9685-ff5bb260df2e")
    expect(powerPlanCheckScript).toContain("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c")
    expect(powerPlanCheckScript).toContain("a1841308-3541-4fab-bc81-f71556f20b4a")
    expect(powerPlanCheckScript).not.toMatch(/-match\s+"Power (saver|performance)/)
    expect(powerPlanCheckScript).not.toContain('Select-String "Ultimate Performance"')
  })

  it("activates Ultimate Performance without matching localized plan names", () => {
    expect(applyUltimatePerformanceScript).toContain("e9a42b02-d5df-448d-aa00-03f14749eb61")
    expect(applyUltimatePerformanceScript).toContain("powercfg /setactive")
    expect(applyUltimatePerformanceScript).not.toContain('Select-String "Ultimate Performance"')
    expect(applyUltimatePerformanceScript).not.toContain(".Split()[3]")
    expect(applyUltimatePerformanceScript).toContain("exit 1")
  })
})

describe("Ultimate Performance tweak script", () => {
  const script = fs.readFileSync("tweaks/ultimate-performance-plan/apply.ps1", "utf8")

  it("uses locale-independent detection", () => {
    expect(script).toContain("e9a42b02-d5df-448d-aa00-03f14749eb61")
    expect(script).not.toContain('Select-String "Ultimate Performance"')
    expect(script).not.toContain(".Split()[3]")
  })
})
