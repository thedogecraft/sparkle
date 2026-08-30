import { exec } from "child_process"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import fs from "fs"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

function runPowerShell(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`,
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message)
        resolve(stdout)
      },
    )
  })
}

function changeRestorePointCooldown(): Promise<string> {
  return runPowerShell(
    "New-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore' -Name 'SystemRestorePointCreationFrequency' -Value 0 -PropertyType DWord -Force",
  )
}

function sanitizeRestorePointName(name: string): string {
  return name.replace(/[^a-zA-Z0-9 _-]/g, "")
}

function getTimestamp(): string {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mi = String(date.getMinutes()).padStart(2, "0")
  const ss = String(date.getSeconds()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`
}

interface BackupResult {
  success: boolean
  label?: string
  message?: string
  error?: string
  points?: any[]
}

export const setupBackupHandlers = (): void => {
  ipcMain.handle("create-sparkle-restore-point", async (): Promise<BackupResult> => {
    const label = `SparkleBackup-${getTimestamp()}`
    try {
      await runPowerShell(`Checkpoint-Computer -Description '${label}'`)
      await changeRestorePointCooldown()
      return { success: true, label }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(
    "create-restore-point",
    async (_event: IpcMainInvokeEvent, name?: string): Promise<BackupResult> => {
      try {
        const safeName = name ? sanitizeRestorePointName(name) : ""
        const label = safeName ? `${safeName}-${getTimestamp()}` : `ManualRestore-${getTimestamp()}`

        await runPowerShell(`Checkpoint-Computer -Description '${label}'`)
        await changeRestorePointCooldown()
        return { success: true, label }
      } catch (error: any) {
        console.error(error)
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle(
    "delete-all-restore-points",
    async (_event: IpcMainInvokeEvent, _sequenceNumber?: number): Promise<BackupResult> => {
      try {
        await runPowerShell(`vssadmin delete shadows /all /quiet`)
        await changeRestorePointCooldown()
        return { success: true }
      } catch (error: any) {
        console.error("Error deleting all restore points:", error)
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle("get-restore-points", async (): Promise<BackupResult> => {
    try {
      const output = await runPowerShell(
        "Get-ComputerRestorePoint | Select-Object SequenceNumber, Description, CreationTime, EventType, RestorePointType | ConvertTo-Json",
      )
      await changeRestorePointCooldown()

      let points: any[] = []
      try {
        points = JSON.parse(output)
        if (!Array.isArray(points)) points = [points]
      } catch {
        points = []
      }
      return { success: true, points }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(
    "restore-restore-point",
    async (_event: IpcMainInvokeEvent, sequenceNumber: number): Promise<BackupResult> => {
      try {
        await runPowerShell(`Restore-Computer -RestorePoint ${sequenceNumber}`)
        await changeRestorePointCooldown()
        return { success: true }
      } catch (error: any) {
        console.error(error)
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle("delete-old-sparkle-backups", async (): Promise<BackupResult> => {
    return new Promise((resolve, reject) => {
      const sparkleRoot = `C:\\Sparkle`
      if (!fs.existsSync(sparkleRoot)) {
        return resolve({ success: true, message: "Sparkle folder does not exist" })
      }

      fs.rm(sparkleRoot, { recursive: true, force: true }, (err) => {
        if (err) return reject(err)
        resolve({ success: true, message: "Sparkle folder deleted" })
      })
    })
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
