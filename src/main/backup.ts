import { ipcMain, IpcMainInvokeEvent } from "electron"
import { getSidecar } from "@main/sidecar"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

interface BackupResult {
  success: boolean
  label?: string
  message?: string
  error?: string
  points?: any[]
}

export const setupBackupHandlers = (): void => {
  ipcMain.handle("create-sparkle-restore-point", async (): Promise<BackupResult> => {
    const sidecar = getSidecar()
    return await sidecar.request("backup.createSparkle")
  })

  ipcMain.handle(
    "create-restore-point",
    async (_event: IpcMainInvokeEvent, name?: string): Promise<BackupResult> => {
      const sidecar = getSidecar()
      return await sidecar.request("backup.create", { name })
    },
  )

  ipcMain.handle(
    "delete-all-restore-points",
    async (): Promise<BackupResult> => {
      const sidecar = getSidecar()
      return await sidecar.request("backup.deleteAll")
    },
  )

  ipcMain.handle("get-restore-points", async (): Promise<BackupResult> => {
    const sidecar = getSidecar()
    return await sidecar.request("backup.list")
  })

  ipcMain.handle(
    "restore-restore-point",
    async (_event: IpcMainInvokeEvent, sequenceNumber: number): Promise<BackupResult> => {
      const sidecar = getSidecar()
      return await sidecar.request("backup.restore", { sequenceNumber })
    },
  )

  ipcMain.handle("delete-old-sparkle-backups", async (): Promise<BackupResult> => {
    const sidecar = getSidecar()
    return await sidecar.request("backup.deleteOld")
  })

  console.log("[Sparkle main/backup.ts]: Backup handlers setup complete")
}

export const cleanupBackupHandlers = (): void => {
  ipcMain.removeHandler("create-sparkle-restore-point")
  ipcMain.removeHandler("create-restore-point")
  ipcMain.removeHandler("delete-all-restore-points")
  ipcMain.removeHandler("get-restore-points")
  ipcMain.removeHandler("restore-restore-point")
  ipcMain.removeHandler("delete-old-sparkle-backups")
}
