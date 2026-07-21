import { ipcMain } from "electron"
import log from "electron-log"
import { executePowerShell, executePowerShellStreaming } from "@main/powershell"
import { mainWindow } from "@main/windowState"
import {
  buildSearchScript,
  buildInstallScript,
  parseSearchOutput,
  UPDATE_ID_PATTERN,
  type WindowsUpdateItem,
} from "@main/windowsUpdate"

const logo = "[Sparkle main/osUpdates.ts]:"

function sendToRenderer(channel: string, ...args: any[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

export const setupOsUpdatesHandlers = (): void => {
  ipcMain.handle("os-updates:check", async () => {
    try {
      const result = await executePowerShell(null, { script: buildSearchScript("Software"), name: "wu-os-search" })
      const parsed = result.success ? parseSearchOutput(result.output ?? "") : { items: [] as WindowsUpdateItem[] }
      if (parsed.error) log.warn(logo, "OS update search reported:", parsed.error)
      return { success: true, updates: parsed.items }
    } catch (error: any) {
      log.error(logo, "os-updates:check failed:", error)
      return { success: false, updates: [], error: error?.message ?? String(error) }
    }
  })

  // Installing OS updates only downloads+stages them via the Windows Update
  // Agent; it never forces a restart. If a restart ends up required, the
  // existing get-pending-update check (already wired to the app's power
  // menu) picks it up the same way it does for any other pending update.
  ipcMain.handle("os-updates:install", async (event, { updateIds }: { updateIds: string[] }) => {
    const ids = (Array.isArray(updateIds) ? updateIds : []).filter((id) => UPDATE_ID_PATTERN.test(id))
    if (ids.length === 0) return { success: false, error: "No valid update ids provided" }

    const appId = "windows-update-batch"
    sendToRenderer("install-start", { appId })
    try {
      const result = await executePowerShellStreaming(event, {
        script: buildInstallScript(ids),
        name: "install-os-updates",
        appId,
      })
      sendToRenderer(result.success ? "install-app-complete" : "install-app-error", { appId })
      sendToRenderer("install-complete")
      return { success: result.success }
    } catch (error: any) {
      log.error(logo, "os-updates:install failed:", error)
      sendToRenderer("install-output", { appId, line: error?.message ?? String(error) })
      sendToRenderer("install-app-error", { appId })
      sendToRenderer("install-complete")
      return { success: false, error: error?.message ?? String(error) }
    }
  })

  log.info(logo, "OS updates handlers setup complete")
}

export const cleanupOsUpdatesHandlers = (): void => {
  ipcMain.removeHandler("os-updates:check")
  ipcMain.removeHandler("os-updates:install")
}

export default { setupOsUpdatesHandlers, cleanupOsUpdatesHandlers }
