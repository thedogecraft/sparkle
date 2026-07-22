import { ipcMain } from "electron"
import { getSidecar } from "@main/sidecar"
import { mainWindow } from "@main/windowState"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

function isSafeId(id: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(id)
}

export async function executePowerShell(_, props) {
  const sidecar = getSidecar()
  const { script, name = "script" } = props
  return await sidecar.request("powershell.run", { script, name })
}

function sendToRenderer(channel: string, ...args: any[]) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

function sendOutput(appId: string, text: string) {
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (line.trim()) {
      sendToRenderer("install-output", { appId, line })
    }
  }
}

async function runPowerShellInWindow(_, { script, name = "script", noExit = true }) {
  const sidecar = getSidecar()
  return await sidecar.request("powershell.runWindow", { script, name, noExit })
}

export async function checkChocolatey(): Promise<{ success: boolean; installed: boolean }> {
  const sidecar = getSidecar()
  return await sidecar.request("choco.check")
}

export const setupPowerShellHandlers = (): void => {
  ipcMain.handle("run-powershell-window", runPowerShellInWindow)
  ipcMain.handle("run-powershell", executePowerShell)
  ipcMain.handle("check-chocolatey", async () => checkChocolatey())
  ipcMain.handle("install-chocolatey", async () => {
    const sidecar = getSidecar()
    return await sidecar.request("choco.install")
  })
  ipcMain.handle("handle-apps", async (event, { action, apps, source }) => {
    const sidecar = getSidecar()

    sidecar.on("install-progress", (appName: string) => {
      if (mainWindow) {
        mainWindow.webContents.send("install-progress", appName)
      }
    })

    sidecar.on("install-complete", () => {
      if (mainWindow) {
        mainWindow.webContents.send("install-complete")
      }
    })

    sidecar.on("install-error", () => {
      if (mainWindow) {
        mainWindow.webContents.send("install-error")
      }
    })

    sidecar.on("installed-apps-checked", (data: any) => {
      if (mainWindow) {
        mainWindow.webContents.send("installed-apps-checked", data)
      }
    })

    switch (action) {
      case "install":
        return await sidecar.request("app.install", { action, apps, source })
      case "uninstall":
        return await sidecar.request("app.uninstall", { action, apps, source })
      case "check-installed":
        return await sidecar.request("app.checkInstalled", { action, apps, source })
      default:
        console.error(`Unknown action: ${action}`)
    }
  })
  console.log("[Sparkle main/powershell.ts]: PowerShell handlers setup complete")
}

export const cleanupPowerShellHandlers = (): void => {
  ipcMain.removeHandler("run-powershell-window")
  ipcMain.removeHandler("run-powershell")
  ipcMain.removeHandler("check-chocolatey")
  ipcMain.removeHandler("install-chocolatey")
  ipcMain.removeHandler("handle-apps")
}
