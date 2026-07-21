import { ipcMain } from "electron"
import log from "electron-log"
import { executePowerShell, executePowerShellStreaming } from "@main/powershell"
import { detectGPU } from "@main/gpu"
import { mainWindow } from "@main/windowState"
import {
  buildSearchScript,
  buildInstallScript,
  parseSearchOutput,
  UPDATE_ID_PATTERN,
  type WindowsUpdateItem,
} from "@main/windowsUpdate"
import { checkNvidiaDriverUpdate } from "@main/nvidiaDriver"
import {
  buildInstalledDriversScript,
  parseInstalledDriversOutput,
  groupInstalledDrivers,
} from "@main/installedDrivers"
import type { GpuDriverStatus, DriverVendorGroup } from "../types"

const logo = "[Sparkle main/driverUpdates.ts]:"

// Verified against winget/msstore directly during development -- neither
// vendor's actual driver-update app ("NVIDIA App", "AMD Software:
// Adrenalin Edition") is a plain winget package. NVIDIA and Intel publish
// theirs to the Microsoft Store instead (source "msstore", still
// winget-installable by id); AMD has no equivalent listed on either source,
// so it always falls through to the manual-link tier below.
const VENDOR_APPS: Record<"nvidia" | "intel", { id: string; name: string }> = {
  nvidia: { id: "XP8CLZL93F5Z4P", name: "NVIDIA App" },
  intel: { id: "9P8K5G2MWW6Z", name: "Intel® Graphics Software" },
}

// Well-known, stable top-level vendor driver pages -- last-resort fallback
// when no automated path is available (currently always the AMD case).
const VENDOR_MANUAL_URLS: Record<string, string> = {
  nvidia: "https://www.nvidia.com/en-us/geforce/drivers/",
  amd: "https://www.amd.com/en/support",
  intel: "https://www.intel.com/content/www/us/en/download-center/home.html",
}

function sendToRenderer(channel: string, ...args: any[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

function vendorFromModel(model: string): "nvidia" | "amd" | "intel" | "other" {
  const m = model.toLowerCase()
  if (m.includes("nvidia")) return "nvidia"
  if (m.includes("amd") || m.includes("radeon")) return "amd"
  if (m.includes("intel")) return "intel"
  return "other"
}

async function getInstalledDriverVersion(model: string): Promise<string> {
  const script = [
    "Get-CimInstance Win32_VideoController |",
    "  Select-Object Name, DriverVersion |",
    "  ConvertTo-Json -Compress",
  ].join(" ")
  const result = await executePowerShell(null, { script, name: "get-driver-version" })
  if (!result.success) return ""
  try {
    const parsed = JSON.parse(result.output ?? "[]")
    const rows = Array.isArray(parsed) ? parsed : [parsed]
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
    const target = normalize(model)
    const match = rows.find((r: any) => normalize(r.Name ?? "").includes(target) || target.includes(normalize(r.Name ?? "")))
    return match?.DriverVersion ?? rows[0]?.DriverVersion ?? ""
  } catch {
    return ""
  }
}

async function isWingetAppInstalled(id: string): Promise<boolean> {
  const result = await executePowerShell(null, {
    script: `winget list --id "${id}" --exact --accept-source-agreements | Out-String`,
    name: "check-vendor-app",
  })
  return !!result.success && !!result.output && !/No installed package found/i.test(result.output)
}

export async function checkGpuDriverStatus(): Promise<GpuDriverStatus> {
  const gpuInfo = await detectGPU()
  if (!gpuInfo.hasGPU) {
    return { hasGPU: false, vendor: null, model: "", installedVersion: "" }
  }

  const vendor = vendorFromModel(gpuInfo.model)
  const installedVersion = await getInstalledDriverVersion(gpuInfo.model)

  const status: GpuDriverStatus = {
    hasGPU: true,
    vendor,
    model: gpuInfo.model,
    installedVersion,
    manualUrl: VENDOR_MANUAL_URLS[vendor],
  }

  if (vendor === "nvidia") {
    status.nvidia = await checkNvidiaDriverUpdate(gpuInfo.model, installedVersion, gpuInfo.hasIntegratedGPU)
    if (status.nvidia.supported) return status
    // Lookup failed (unrecognized model, API unavailable) -- fall through to
    // the vendor-app tier below just like AMD/Intel.
  }

  const vendorApp = vendor === "nvidia" || vendor === "intel" ? VENDOR_APPS[vendor] : undefined
  if (vendorApp) {
    status.vendorAppId = vendorApp.id
    status.vendorAppName = vendorApp.name
    status.vendorAppInstallable = true
    status.vendorAppInstalled = await isWingetAppInstalled(vendorApp.id)
  }

  return status
}

export async function launchInstalledApp(nameHint: string): Promise<boolean> {
  const script = [
    "$app = Get-StartApps | Where-Object { $_.Name -like " + `"*${nameHint.replace(/"/g, "")}*"` + " } | Select-Object -First 1",
    "if ($app) { Start-Process \"shell:AppsFolder\\$($app.AppID)\"; Write-Output 'launched' } else { Write-Output 'not-found' }",
  ].join("\n")
  const result = await executePowerShell(null, { script, name: "launch-vendor-app" })
  return !!result.success && !!result.output?.includes("launched")
}

export const setupDriverUpdatesHandlers = (): void => {
  ipcMain.handle("driver-updates:check", async () => {
    try {
      const [wuResult, installedResult] = await Promise.all([
        executePowerShell(null, { script: buildSearchScript("Driver"), name: "wu-driver-search" }),
        executePowerShell(null, { script: buildInstalledDriversScript(), name: "installed-drivers" }),
      ])

      const parsed = wuResult.success ? parseSearchOutput(wuResult.output ?? "") : { items: [] as WindowsUpdateItem[] }
      if (parsed.error) log.warn(logo, "driver search reported:", parsed.error)

      const installedRows = installedResult.success ? parseInstalledDriversOutput(installedResult.output ?? "") : []
      const vendorGroups: DriverVendorGroup[] = groupInstalledDrivers(installedRows, parsed.items)

      return { success: true, updates: parsed.items, vendorGroups }
    } catch (error: any) {
      log.error(logo, "driver-updates:check failed:", error)
      return { success: false, updates: [], vendorGroups: [], error: error?.message ?? String(error) }
    }
  })

  ipcMain.handle("driver-updates:install", async (event, { updateIds }: { updateIds: string[] }) => {
    const ids = (Array.isArray(updateIds) ? updateIds : []).filter((id) => UPDATE_ID_PATTERN.test(id))
    if (ids.length === 0) return { success: false, error: "No valid update ids provided" }

    const appId = "windows-driver-batch"
    sendToRenderer("install-start", { appId })
    try {
      const result = await executePowerShellStreaming(event, {
        script: buildInstallScript(ids),
        name: "install-drivers",
        appId,
      })
      sendToRenderer(result.success ? "install-app-complete" : "install-app-error", { appId })
      sendToRenderer("install-complete")
      return { success: result.success }
    } catch (error: any) {
      log.error(logo, "driver-updates:install failed:", error)
      sendToRenderer("install-output", { appId, line: error?.message ?? String(error) })
      sendToRenderer("install-app-error", { appId })
      sendToRenderer("install-complete")
      return { success: false, error: error?.message ?? String(error) }
    }
  })

  ipcMain.handle("gpu-driver:check", async () => {
    try {
      return { success: true, ...(await checkGpuDriverStatus()) }
    } catch (error: any) {
      log.error(logo, "gpu-driver:check failed:", error)
      return { success: false, hasGPU: false, vendor: null, model: "", installedVersion: "", error: error?.message }
    }
  })

  // Downloads the vendor's real installer to a temp path and hands off to
  // it -- deliberately not a silent unattended install. GPU driver installs
  // can black-screen a session if something goes wrong; Nvidia's own
  // installer UI is the safer place for that risk to live, not a script
  // Sparkle runs unattended.
  ipcMain.handle("gpu-driver:download", async (event, { url, appId }: { url: string; appId: string }) => {
    if (!/^https:\/\/[a-z0-9.-]+\.nvidia\.com\//i.test(url)) {
      return { success: false, error: "Refused: not a recognized Nvidia download URL" }
    }
    sendToRenderer("install-start", { appId })
    const script = [
      "$ErrorActionPreference = 'Stop'",
      `$dest = Join-Path $env:TEMP "sparkle-nvidia-driver-$([guid]::NewGuid().ToString('N').Substring(0,8)).exe"`,
      `Write-Output "Downloading driver installer..."`,
      `Invoke-WebRequest -Uri "${url}" -OutFile $dest -UseBasicParsing`,
      `Write-Output "Downloaded to $dest"`,
      "Start-Process -FilePath $dest",
      `Write-Output "Launched installer."`,
    ].join("\n")
    try {
      const result = await executePowerShellStreaming(event, { script, name: "download-nvidia-driver", appId })
      sendToRenderer(result.success ? "install-app-complete" : "install-app-error", { appId })
      sendToRenderer("install-complete")
      return { success: result.success }
    } catch (error: any) {
      log.error(logo, "gpu-driver:download failed:", error)
      sendToRenderer("install-output", { appId, line: error?.message ?? String(error) })
      sendToRenderer("install-app-error", { appId })
      sendToRenderer("install-complete")
      return { success: false, error: error?.message ?? String(error) }
    }
  })

  ipcMain.handle("gpu-driver:launch-app", async (_event, { nameHint }: { nameHint: string }) => {
    try {
      const launched = await launchInstalledApp(nameHint)
      return { success: launched }
    } catch (error: any) {
      log.error(logo, "gpu-driver:launch-app failed:", error)
      return { success: false, error: error?.message ?? String(error) }
    }
  })

  log.info(logo, "Driver updates handlers setup complete")
}

export const cleanupDriverUpdatesHandlers = (): void => {
  ipcMain.removeHandler("driver-updates:check")
  ipcMain.removeHandler("driver-updates:install")
  ipcMain.removeHandler("gpu-driver:check")
  ipcMain.removeHandler("gpu-driver:download")
  ipcMain.removeHandler("gpu-driver:launch-app")
}

export default { setupDriverUpdatesHandlers, cleanupDriverUpdatesHandlers }
