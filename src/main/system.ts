import { ipcMain } from "electron"
import { getSidecar } from "@main/sidecar"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

async function getSystemInfo() {
  const sidecar = getSidecar()
  return await sidecar.request("system.info")
}

function restartSystem() {
  const sidecar = getSidecar()
  sidecar.request("system.restart")
  return { success: true }
}

function restartExplorer() {
  const sidecar = getSidecar()
  sidecar.request("system.restartExplorer")
  return { success: true }
}

function getUserName() {
  const sidecar = getSidecar()
  return sidecar.request("system.getUserName")
}

function clearSparkleCache() {
  const sidecar = getSidecar()
  return sidecar.request("system.clearCache")
}

function openLogFolder() {
  const { shell } = require("electron")
  const path = require("path")
  const os = require("os")
  const fs = require("fs")

  const logPath = path.join(
    process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
    "sparkle",
    "logs",
  )
  if (fs.existsSync(logPath)) {
    shell.openPath(logPath)
    return { success: true }
  } else {
    return { success: false, error: "Logs directory does not exist." }
  }
}

async function getAdminStatus(): Promise<boolean> {
  const sidecar = getSidecar()
  const result = await sidecar.request("system.getAdminStatus")
  return result.admin ?? false
}

function ensureWinget() {
  const sidecar = getSidecar()
  return sidecar.request("system.ensureWinget")
}

export { ensureWinget }

async function checkWinget(): Promise<{ success: boolean; installed: boolean }> {
  const sidecar = getSidecar()
  return await sidecar.request("system.checkWinget")
}

export { checkWinget }

export const setupSystemHandlers = (): void => {
  ipcMain.handle("restart", restartSystem)
  ipcMain.handle("open-log-folder", openLogFolder)
  ipcMain.handle("clear-sparkle-cache", clearSparkleCache)
  ipcMain.handle("get-system-info", getSystemInfo)
  ipcMain.handle("get-user-name", getUserName)
  ipcMain.handle("restart-explorer", restartExplorer)
  ipcMain.handle("check-winget", async () => checkWinget())
  ipcMain.handle("get-admin-status", async () => getAdminStatus())
  ipcMain.handle("install-winget", ensureWinget)
  console.log("[Sparkle main/system.ts]: System handlers setup complete")
}

export const cleanupSystemHandlers = (): void => {
  ipcMain.removeHandler("restart")
  ipcMain.removeHandler("open-log-folder")
  ipcMain.removeHandler("clear-sparkle-cache")
  ipcMain.removeHandler("get-system-info")
  ipcMain.removeHandler("get-user-name")
  ipcMain.removeHandler("restart-explorer")
  ipcMain.removeHandler("check-winget")
  ipcMain.removeHandler("install-winget")
}
