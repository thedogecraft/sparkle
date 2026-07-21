import { describe, it, expect } from "vitest"
import {
  normalizeVendor,
  parseInstalledDriversOutput,
  matchUpdateToDevice,
  groupInstalledDrivers,
  type RawDriverRow,
} from "@main/installedDrivers"
import type { WindowsUpdateItem } from "../../types"

describe("normalizeVendor", () => {
  it("buckets the real messy Intel manufacturer strings captured live into one vendor", () => {
    for (const raw of ["Intel", "INTEL", "Intel Corporation", "Intel(R) Corporation", "Intel� Corporation"]) {
      expect(normalizeVendor(raw)).toBe("Intel")
    }
  })

  it("buckets the real Lenovo variants together", () => {
    expect(normalizeVendor("Lenovo")).toBe("Lenovo")
    expect(normalizeVendor("Lenovo Ltd.")).toBe("Lenovo")
  })

  it("sends generic '(Standard ...)' Windows class entries to Other", () => {
    expect(normalizeVendor("(Standard display types)")).toBe("Other")
    expect(normalizeVendor("(Standard USB Host Controller)")).toBe("Other")
    expect(normalizeVendor("")).toBe("Other")
  })

  it("keeps a real one-off vendor as its own group rather than merging into Other", () => {
    expect(normalizeVendor("Realtek")).toBe("Realtek")
    expect(normalizeVendor("Synaptics Incorporated")).toBe("Synaptics")
    expect(normalizeVendor("Brother")).toBe("Brother")
  })
})

describe("parseInstalledDriversOutput", () => {
  it("converts the real .NET /Date(ms)/ wire format to a readable date", () => {
    const raw = JSON.stringify([
      { DeviceName: "Intel(R) Graphics", Manufacturer: "Intel", DriverVersion: "32.0.101.8724", DriverDate: "/Date(1776556800000)/", DeviceClass: "DISPLAY" },
    ])
    const rows = parseInstalledDriversOutput(raw)
    expect(rows[0].DriverDate).not.toContain("/Date(")
    expect(rows[0].DriverDate).toMatch(/\d/)
  })

  it("filters out real noise classes (print queues, software components, volumes)", () => {
    const raw = JSON.stringify([
      { DeviceName: "Local Print Queue", Manufacturer: "Microsoft", DriverVersion: "1.0", DeviceClass: "PRINTQUEUE" },
      { DeviceName: "Some component", Manufacturer: "Intel", DriverVersion: "1.0", DeviceClass: "SOFTWARECOMPONENT" },
      { DeviceName: "Intel(R) Graphics", Manufacturer: "Intel", DriverVersion: "32.0.101.8724", DeviceClass: "DISPLAY" },
    ])
    const rows = parseInstalledDriversOutput(raw)
    expect(rows).toHaveLength(1)
    expect(rows[0].DeviceName).toBe("Intel(R) Graphics")
  })

  it("dedupes rows that enumerate the same device multiple times, as observed live", () => {
    const raw = JSON.stringify([
      { DeviceName: "Local Print Queue", Manufacturer: "Microsoft", DriverVersion: "10.0.26100.1", DeviceClass: "PRINTER" },
      { DeviceName: "Local Print Queue", Manufacturer: "Microsoft", DriverVersion: "10.0.26100.1", DeviceClass: "PRINTER" },
      { DeviceName: "Local Print Queue", Manufacturer: "Microsoft", DriverVersion: "10.0.26100.1", DeviceClass: "PRINTER" },
    ])
    expect(parseInstalledDriversOutput(raw)).toHaveLength(1)
  })

  it("returns [] for garbage input instead of throwing", () => {
    expect(parseInstalledDriversOutput("")).toEqual([])
    expect(parseInstalledDriversOutput("not json")).toEqual([])
  })
})

describe("matchUpdateToDevice", () => {
  const device: RawDriverRow = {
    DeviceName: "Intel(R) Graphics",
    Manufacturer: "Intel(R) Corporation",
    DriverVersion: "32.0.101.8724",
    DeviceClass: "DISPLAY",
  }

  it("matches on normalized vendor + device class", () => {
    const update: WindowsUpdateItem = {
      updateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      title: "Intel - Display - 32.0.101.8900",
      kb: "",
      type: "Driver",
      sizeBytes: 0,
      driverProvider: "Intel",
      driverClass: "Display",
    }
    expect(matchUpdateToDevice(update, device)).toBe(true)
  })

  it("does not match across different vendors even with similar titles", () => {
    const update: WindowsUpdateItem = {
      updateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      title: "AMD - Display - 1.0",
      kb: "",
      type: "Driver",
      sizeBytes: 0,
      driverProvider: "AMD",
      driverClass: "Display",
    }
    expect(matchUpdateToDevice(update, device)).toBe(false)
  })

  it("never matches when the vendor normalizes to Other on either side", () => {
    const genericDevice: RawDriverRow = { DeviceName: "USB Root Hub", Manufacturer: "(Standard USB Host Controller)", DriverVersion: "1.0" }
    const update: WindowsUpdateItem = {
      updateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      title: "Generic - USB - 1.1",
      kb: "",
      type: "Driver",
      sizeBytes: 0,
      driverProvider: "(Standard USB Host Controller)",
    }
    expect(matchUpdateToDevice(update, genericDevice)).toBe(false)
  })
})

describe("groupInstalledDrivers", () => {
  const rows: RawDriverRow[] = [
    { DeviceName: "Intel(R) Graphics", Manufacturer: "Intel", DriverVersion: "32.0.101.8724", DeviceClass: "DISPLAY" },
    { DeviceName: "Intel(R) Wi-Fi 6", Manufacturer: "Intel Corporation", DriverVersion: "22.0.0.1", DeviceClass: "NET" },
    { DeviceName: "Lenovo TrackPoint", Manufacturer: "Lenovo Ltd.", DriverVersion: "1.0.0", DeviceClass: "MOUSE" },
    { DeviceName: "USB Root Hub", Manufacturer: "(Standard USB Host Controller)", DriverVersion: "1.0", DeviceClass: "USB" },
  ]

  it("groups devices under their normalized vendor", () => {
    const groups = groupInstalledDrivers(rows, [])
    const intel = groups.find((g) => g.vendor === "Intel")
    expect(intel?.devices.map((d) => d.deviceName)).toEqual(["Intel(R) Graphics", "Intel(R) Wi-Fi 6"])
    expect(groups.find((g) => g.vendor === "Lenovo")?.devices).toHaveLength(1)
  })

  it("sorts Other last regardless of update status", () => {
    const groups = groupInstalledDrivers(rows, [])
    expect(groups[groups.length - 1].vendor).toBe("Other")
  })

  it("surfaces vendor groups with a pending update before ones without", () => {
    const updates: WindowsUpdateItem[] = [
      { updateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", title: "Lenovo - Mouse", kb: "", type: "Driver", sizeBytes: 0, driverProvider: "Lenovo Ltd.", driverClass: "MOUSE" },
    ]
    const groups = groupInstalledDrivers(rows, updates)
    expect(groups[0].vendor).toBe("Lenovo")
    expect(groups[0].devices[0].updateId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
  })
})
