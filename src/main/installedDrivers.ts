import type { DriverVendorGroup, InstalledDriverDevice, WindowsUpdateItem } from "../types"

export interface RawDriverRow {
  DeviceName: string
  Manufacturer: string
  DriverVersion: string
  DriverDate?: string
  DeviceClass?: string
}

// Real Win32_PnPSignedDriver Manufacturer values captured live on a Lenovo
// ThinkPad: "Intel", "INTEL", "Intel Corporation", "Intel(R) Corporation",
// and a mojibake "Intel® Corporation" (the (R)/® glyph fails to round-trip
// through PowerShell's console encoding) all refer to the same vendor;
// likewise "Lenovo" vs "Lenovo Ltd.". This buckets the noisy raw strings
// into the handful of display names the UI actually groups by.
const VENDOR_PATTERNS: Array<[RegExp, string]> = [
  [/intel/i, "Intel"],
  [/\blenovo\b/i, "Lenovo"],
  [/nvidia/i, "NVIDIA"],
  [/\bamd\b|advanced micro devices/i, "AMD"],
  [/realtek/i, "Realtek"],
  [/synaptics/i, "Synaptics"],
  [/microsoft/i, "Microsoft"],
]

export function normalizeVendor(manufacturer: string): string {
  const trimmed = (manufacturer ?? "").trim()
  for (const [pattern, name] of VENDOR_PATTERNS) {
    if (pattern.test(trimmed)) return name
  }
  // "(Standard display types)"-style generic Windows class entries and any
  // other one-off vendor get their own bucket rather than diluting the
  // named-vendor groups the user actually wants to scan (Intel, Lenovo...).
  if (/^\(standard/i.test(trimmed) || !trimmed) return "Other"
  return trimmed.replace(/\s*(corporation|ltd\.?|inc\.?)\s*$/i, "").trim() || "Other"
}

// Classes verified live to be non-actionable noise on a real machine: queue
// registrations (one row per configured printer, including virtual ones like
// "Microsoft Print to PDF"), driver-package metadata with no device behind
// it, and volume/snapshot entries that aren't drivers a user would think to
// "update". Deliberately an exclude-list, not an allow-list, so an unusual
// real device in an unanticipated class isn't silently hidden.
const NOISE_CLASSES = new Set(["SOFTWARECOMPONENT", "SOFTWAREDEVICE", "PRINTQUEUE", "VOLUME", "VOLUMESNAPSHOT"])

export function buildInstalledDriversScript(): string {
  return [
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "Get-CimInstance Win32_PnPSignedDriver |",
    "  Where-Object { $_.DeviceName } |",
    "  Select-Object DeviceName, Manufacturer, DriverVersion, DriverDate, DeviceClass |",
    "  ConvertTo-Json -Depth 2 -Compress",
  ].join("\n")
}

// DriverDate comes back from CIM in the legacy .NET wire format
// "/Date(1150848000000)/" (epoch milliseconds), not ISO -- verified against
// real output. Converted here so the renderer never has to know about it.
function parseCimDate(value: string | undefined): string {
  if (!value) return ""
  const match = /\/Date\((\d+)\)\//.exec(value)
  if (!match) return value
  const date = new Date(Number(match[1]))
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()
}

export function parseInstalledDriversOutput(raw: string): RawDriverRow[] {
  let rows: RawDriverRow[]
  try {
    const parsed = JSON.parse(raw.trim() || "[]")
    rows = Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return []
  }

  rows = rows
    .filter((r) => r.DeviceName && !NOISE_CLASSES.has((r.DeviceClass ?? "").toUpperCase()))
    .map((r) => ({ ...r, DriverDate: parseCimDate(r.DriverDate) }))

  // The same physical device commonly enumerates multiple identical rows
  // (verified: 250 raw rows collapsed to 158 distinct on a real machine).
  const seen = new Set<string>()
  return rows.filter((r) => {
    const key = `${r.DeviceName}|${r.Manufacturer}|${r.DriverVersion}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

// WU driver titles look like "Intel - Display - 32.0.101.8724" or similar,
// not a clean device name -- there is no reliable key shared between
// Win32_PnPSignedDriver and a WU search hit. This is a best-effort match on
// vendor + device class; it will under-match (miss a real pairing) far more
// often than it over-matches, which is the safer direction to be wrong in.
export function matchUpdateToDevice(update: WindowsUpdateItem, device: RawDriverRow): boolean {
  const updateVendor = normalizeVendor(update.driverProvider ?? "")
  const deviceVendor = normalizeVendor(device.Manufacturer ?? "")
  if (updateVendor !== deviceVendor || updateVendor === "Other") return false

  const updateClass = normalizeForMatch(update.driverClass ?? "")
  const deviceClass = normalizeForMatch(device.DeviceClass ?? "")
  if (updateClass && deviceClass && updateClass === deviceClass) return true

  const updateTitle = normalizeForMatch(update.title)
  const deviceName = normalizeForMatch(device.DeviceName)
  return updateTitle.includes(deviceName) || deviceName.includes(updateTitle)
}

export function groupInstalledDrivers(
  rows: RawDriverRow[],
  pendingUpdates: WindowsUpdateItem[],
): DriverVendorGroup[] {
  const groups = new Map<string, InstalledDriverDevice[]>()

  for (const row of rows) {
    if (!row.DeviceName) continue
    const vendor = normalizeVendor(row.Manufacturer)
    const match = pendingUpdates.find((u) => matchUpdateToDevice(u, row))

    const device: InstalledDriverDevice = {
      deviceName: row.DeviceName,
      driverVersion: row.DriverVersion ?? "",
      driverDate: row.DriverDate ?? "",
      deviceClass: row.DeviceClass ?? "",
      updateId: match?.updateId,
    }

    if (!groups.has(vendor)) groups.set(vendor, [])
    groups.get(vendor)!.push(device)
  }

  return [...groups.entries()]
    .map(([vendor, devices]) => ({
      vendor,
      devices: devices.sort((a, b) => a.deviceName.localeCompare(b.deviceName)),
    }))
    .sort((a, b) => {
      // Devices with a pending update surface their vendor group first;
      // "Other" always sinks to the bottom regardless.
      if (a.vendor === "Other") return 1
      if (b.vendor === "Other") return -1
      const aHasUpdate = a.devices.some((d) => d.updateId)
      const bHasUpdate = b.devices.some((d) => d.updateId)
      if (aHasUpdate !== bHasUpdate) return aHasUpdate ? -1 : 1
      return a.vendor.localeCompare(b.vendor)
    })
}
