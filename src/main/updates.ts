import { app, ipcMain, BrowserWindow } from "electron"
import { autoUpdater, UpdateInfo } from "electron-updater"

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  autoUpdater.autoDownload = true
  autoUpdater.disableWebInstaller = false
  autoUpdater.autoInstallOnAppQuit = true

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    const win = getMainWindow()
    win?.webContents.send("updater:available", {
      version: info.version,
      releaseNotes: info.releaseNotes ?? undefined,
    })
  })

  autoUpdater.on("update-not-available", () => {
    const win = getMainWindow()
    win?.webContents.send("updater:not-available", { currentVersion: app.getVersion() })
  })

  autoUpdater.on("error", (err: Error) => {
    const win = getMainWindow()
    win?.webContents.send("updater:error", { message: String(err) })
  })

  autoUpdater.on("download-progress", (progress: any) => {
    const win = getMainWindow()
    win?.webContents.send("updater:download-progress", {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    const win = getMainWindow()
    win?.webContents.send("updater:downloaded", { version: info.version })
  })

  ipcMain.handle("updater:get-version", () => app.getVersion())

  ipcMain.handle("updater:check", async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { ok: true, updateInfo: result?.updateInfo ?? null }
    } catch (error: any) {
      return { ok: false, error: String(error) }
    }
  })

  ipcMain.handle("updater:download", async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: String(error) }
    }
  })

  ipcMain.handle("updater:install", () => {
    try {
      autoUpdater.quitAndInstall(false, true)
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: String(error) }
    }
  })

  setTimeout(() => triggerAutoUpdateCheck(), 3000)
}

export async function triggerAutoUpdateCheck(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates()
  } catch {}
}
