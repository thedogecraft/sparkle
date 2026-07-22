import { ipcMain, app } from "electron"
import { executePowerShell } from "@main/powershell"
import { mainWindow } from "@main/windowState"
import log from "electron-log"
import fs from "fs"

console.log = log.log
console.error = log.error
console.warn = log.warn

interface InstalledApp {
  id: string
  name: string
  version: string
  installDate: string
  icon?: string
  uninstallString: string
  quietUninstallString: string
  isStoreApp: boolean
  packageName: string
}

let cache: InstalledApp[] | null = null

const getInstalledAppsScript = `
$paths = @(
  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)

$apps = @{}

foreach ($path in $paths) {
  Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
    Where-Object {
      $_.DisplayName -and
      $_.SystemComponent -ne 1 -and
      $_.DisplayName -notmatch '^(Update for|Security Update|Security Intelligence Update|Hotfix|KB\\d+|Cumulative Update|Definition Update|Update for Microsoft)'
    } |
    ForEach-Object {
      $id = ($_.DisplayName -replace '[^a-zA-Z0-9]', '-').ToLower()
      $apps[$id] = @{
        id = $id
        name = $_.DisplayName
        version = if ($_.DisplayVersion) { $_.DisplayVersion } else { '' }
        installDate = if ($_.InstallDate) { $_.InstallDate } else { '' }
        displayIcon = if ($_.DisplayIcon) { ($_.DisplayIcon -replace '"', '').Split(',')[0].Trim() } else { '' }
        publisher = if ($_.Publisher) { $_.Publisher } else { '' }
        installLocation = if ($_.InstallLocation) { $_.InstallLocation } else { '' }
        uninstallString = if ($_.UninstallString) { $_.UninstallString -replace '"', '' } else { '' }
        quietUninstallString = if ($_.QuietUninstallString) { $_.QuietUninstallString -replace '"', '' } else { '' }
        isStoreApp = $false
        packageName = ''
      }
    }
}

Get-AppxPackage |
  Where-Object {
    $_.Name -notmatch 'Microsoft\\.NET|Microsoft\\.VCLibs|Microsoft\\.UI|Microsoft\\.WindowsStore|Microsoft\\.StorePurchaseApp'
  } |
  ForEach-Object {
    $id = ('appx-' + $_.PackageFamilyName).ToLower()
    if (-not $apps.ContainsKey($id)) {
      $apps[$id] = @{
        id = $id
        name = $_.Name
        version = $_.Version.ToString()
        installDate = ''
        displayIcon = ''
        publisher = $_.Publisher
        installLocation = $_.InstallLocation
        uninstallString = ''
        quietUninstallString = ''
        isStoreApp = $true
        packageName = $_.PackageFullName
      }
    }
  }

$list = $apps.Values | Sort-Object name

if ($list.Count -eq 0) {
  return '[]'
}

$jsonParts = $list | ForEach-Object { $_ | ConvertTo-Json -Compress }
return "[$($jsonParts -join ',')]"
`

async function getInstalledApps(): Promise<InstalledApp[]> {
  let result: { success: boolean; output?: string; error?: string } | null = null
  try {
    if (cache) {
      return cache
    } else {
      result = await executePowerShell(null, {
        script: getInstalledAppsScript,
        name: "Get-InstalledApps",
      })
    }

    if (!result.success) {
      console.error("Failed to get installed apps:", result.error)
      return []
    }

    const rawApps: Array<{
      id: string
      name: string
      version: string
      installDate: string
      displayIcon: string
      installLocation: string
      uninstallString: string
      quietUninstallString: string
      isStoreApp: boolean
      packageName: string
    }> = JSON.parse(result.output!)
    const rawList = Array.isArray(rawApps) ? rawApps : [rawApps]

    const apps: InstalledApp[] = []
    for (const raw of rawList) {
      let iconDataUrl: string | undefined

      if (raw.displayIcon && fs.existsSync(raw.displayIcon)) {
        try {
          const nativeIcon = await app.getFileIcon(raw.displayIcon, { size: "small" })
          iconDataUrl = nativeIcon.toDataURL()
        } catch {
          // fall through
        }
      }

      apps.push({
        id: raw.id,
        name: raw.name,
        version: raw.version || "Unknown",
        installDate: raw.installDate || "Unknown",
        icon: iconDataUrl,
        uninstallString: raw.uninstallString || "",
        quietUninstallString: raw.quietUninstallString || "",
        isStoreApp: raw.isStoreApp || false,
        packageName: raw.packageName || "",
      })
    }
    cache = apps
    return apps
  } catch (error) {
    console.error("Error getting installed apps:", error)
    return []
  }
}

async function uninstallApps(
  _event: Electron.IpcMainInvokeEvent,
  apps: Array<{
    name: string
    uninstallString: string
    quietUninstallString: string
    isStoreApp: boolean
    packageName: string
  }>,
): Promise<{
  success: boolean
  results: Array<{ name: string; success: boolean; error?: string }>
}> {
  const results: Array<{ name: string; success: boolean; error?: string }> = []

  for (const { name, uninstallString, quietUninstallString, isStoreApp, packageName } of apps) {
    if (!mainWindow) {
      results.push({ name, success: false, error: "Main window not available" })
      continue
    }

    mainWindow.webContents.send("uninstall-progress", name)

    try {
      if (isStoreApp) {
        const script = `Remove-AppxPackage "${packageName}"`
        const result = await executePowerShell(null, { script, name: `Uninstall-${name}` })
        const success = result.success
        console.log(`Uninstall Store app ${name}: ${success ? "success" : "failed"}`)
        results.push({ name, success, error: success ? undefined : result.error })
        continue
      }

      const raw = quietUninstallString || uninstallString
      if (!raw) {
        results.push({ name, success: false, error: "No uninstall string available" })
        continue
      }

      const msiMatch = raw.match(/MsiExec\.exe\s+(.+)/i)

      if (!msiMatch) {
        const exeMatch = raw.match(/^(.+?\.exe)(.*)/i)
        if (!exeMatch) {
          results.push({ name, success: false, error: "Could not parse uninstall string" })
          continue
        }
        const exePath = exeMatch[1].trim()
        const exeArgs = exeMatch[2].trim()
        const script = `$p = Start-Process '${exePath.replace(/'/g, "''")}' -ArgumentList '${exeArgs || "/S"}' -PassThru; $p.WaitForExit(); Start-Sleep -Seconds 2; $p.ExitCode`

        const result = await executePowerShell(null, { script, name: `Uninstall-${name}` })
        const exitCode = parseInt(result.output?.trim() ?? "1", 10)
        const success = result.success && (exitCode === 0 || exitCode === 3010)
        console.log(`Uninstall ${name}: exit ${exitCode}`)
        results.push({ name, success, error: success ? undefined : `Exit code ${exitCode}` })
        continue
      }

      const script = `$p = Start-Process msiexec.exe -ArgumentList '${msiMatch[1].trim()} /quiet /norestart' -PassThru; $p.WaitForExit(); $p.ExitCode`

      const result = await executePowerShell(null, {
        script,
        name: `Uninstall-${name}`,
      })

      const exitCode = parseInt(result.output?.trim() ?? "1", 10)
      const success = result.success && (exitCode === 0 || exitCode === 3010)

      console.log(`Uninstall ${name}: exit ${exitCode}`)
      results.push({ name, success, error: success ? undefined : `Exit code ${exitCode}` })
    } catch (err) {
      console.error(`Uninstall ${name} failed:`, err)
      results.push({ name, success: false, error: String(err) })
    }
  }

  if (mainWindow) {
    mainWindow.webContents.send("uninstall-complete")
  }

  if (results.some((r) => r.success)) {
    cache = null
  }

  return { success: results.some((r) => r.success), results }
}

function reloadApps(): void {
  cache = null
  getInstalledApps()
}

export const setupDebloatHandlers = (): void => {
  ipcMain.handle("get-installed-apps", getInstalledApps)
  ipcMain.handle("reload-installed-apps", reloadApps)
  ipcMain.handle("uninstall-apps", uninstallApps)
}

export const cleanupDebloatHandlers = (): void => {
  ipcMain.removeHandler("get-installed-apps")
  ipcMain.removeHandler("uninstall-apps")
}
