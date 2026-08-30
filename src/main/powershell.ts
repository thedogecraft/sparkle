import { promises as fsp } from "fs"
import path from "path"
import util from "util"
import { exec, spawn } from "child_process"
import { app, ipcMain } from "electron"
import { mainWindow } from "@main/windowState"
import fs from "fs"
import log from "electron-log"
const execPromise = util.promisify(exec)

console.log = log.log
console.error = log.error
console.warn = log.warn

function isSafeId(id: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(id)
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export interface ExecutePowerShellOptions {
  script: string
  name?: string
  output?: boolean
}

export type PowerShellResult =
  | { success: true; output?: string; error?: never }
  | { success: false; error: string; output?: string }

export async function executePowerShell(
  props: ExecutePowerShellOptions,
): Promise<PowerShellResult> {
  const { script, name = "script", output = true } = props

  try {
    const tempDir = path.join(app.getPath("userData"), "scripts")
    ensureDirectoryExists(tempDir)
    const tempFile = path.join(tempDir, `${name}-${Date.now()}.ps1`)

    await fsp.writeFile(tempFile, script)

    const { stdout, stderr } = await execPromise(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`,
    )

    await fsp.unlink(tempFile).catch(console.error)

    if (stderr) {
      console.warn(`PowerShell stderr [${name}]:`, stderr)
    }

    if (output == true) {
      console.log(`PowerShell stdout [${name}]:`, stdout)
    }

    return { success: true, output: stdout }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`PowerShell execution error [${name}]:`, error)
    return { success: false, error: message }
  }
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

export interface ExecutePowerShellStreamingOptions {
  script: string
  name?: string
  appId: string
}

export function executePowerShellStreaming(
  props: ExecutePowerShellStreamingOptions,
): Promise<PowerShellResult> {
  const { script, name = "script", appId } = props

  return new Promise(async (resolve) => {
    const tempDir = path.join(app.getPath("userData"), "scripts")
    ensureDirectoryExists(tempDir)
    const tempFile = path.join(tempDir, `${name}-${Date.now()}.ps1`)

    await fsp.writeFile(tempFile, script)

    let fullOutput = ""

    const child = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      tempFile,
    ])

    child.stdout?.on("data", (data: Buffer) => {
      const text = data.toString()
      fullOutput += text
      sendOutput(appId, text)
    })

    child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString()
      fullOutput += text
      sendOutput(appId, text)
    })

    child.on("close", async (code) => {
      await fsp.unlink(tempFile).catch(console.error)

      if (code === 0) {
        console.log(`PowerShell stdout [${name}]:`, fullOutput)
        resolve({ success: true, output: fullOutput })
      } else {
        console.error(`PowerShell execution error [${name}]: Exit code ${code}`)
        resolve({ success: false, error: `Process exited with code ${code}`, output: fullOutput })
      }
    })

    child.on("error", async (error) => {
      await fsp.unlink(tempFile).catch(console.error)
      console.error(`PowerShell spawn error [${name}]:`, error)
      resolve({ success: false, error: error.message })
    })
  })
}

interface RunPowerShellInWindowOptions {
  script: string
  name?: string
  noExit?: boolean
}

async function runPowerShellInWindow(
  props: RunPowerShellInWindowOptions,
): Promise<PowerShellResult> {
  const { script, name = "script", noExit = true } = props

  try {
    const tempDir = path.join(app.getPath("userData"), "scripts")
    ensureDirectoryExists(tempDir)

    const tempFile = path.join(tempDir, `${name}-${Date.now()}.ps1`)
    await fsp.writeFile(tempFile, script)
    const noExitFlag = noExit ? "-NoExit" : ""
    const command = `start powershell.exe ${noExitFlag} -ExecutionPolicy Bypass -File "${tempFile}"`

    exec(command, (error) => {
      if (error) {
        console.error(`Error launching PowerShell window [${name}]:`, error)
      }
    })

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error in runPowerShellInWindow [${name}]:`, error)
    return { success: false, error: message }
  }
}

export async function checkChocolatey(): Promise<{ success: boolean; installed: boolean }> {
  try {
    const chocoPath = path.join("C:\\ProgramData\\chocolatey\\bin\\choco.exe")
    const installed = fs.existsSync(chocoPath)
    if (installed) {
      console.log("Chocolatey is installed:", chocoPath)
    } else {
      console.log("Chocolatey is not installed")
    }
    return { success: true, installed }
  } catch (error) {
    console.error("Error checking Chocolatey installation:", error)
    return { success: false, installed: false }
  }
}

export const setupPowerShellHandlers = (): void => {
  ipcMain.handle("run-powershell-window", (_event, props: RunPowerShellInWindowOptions) =>
    runPowerShellInWindow(props),
  )
  ipcMain.handle("run-powershell", (_event, props: ExecutePowerShellOptions) =>
    executePowerShell(props),
  )
  ipcMain.handle("check-chocolatey", async () => checkChocolatey())
  ipcMain.handle("install-chocolatey", async () => {
    try {
      const result = await executePowerShell({
        script: "winget install --id chocolatey.chocolatey --source winget",
        name: "install-chocolatey",
      })
      if (result.success) {
        return { installed: true, version: result.output?.trim() ?? "" }
      } else {
        return { installed: false }
      }
    } catch (error) {
      console.error("Error installing Chocolatey:", error)
      return { installed: false }
    }
  })
  ipcMain.handle("handle-apps", async (_event, { action, apps, source }) => {
    switch (action) {
      case "install":
        for (const appId of apps) {
          if (!isSafeId(appId)) {
            console.error(`Rejected unsafe app ID: ${appId}`)
            sendToRenderer("install-app-error", { appId })
            continue
          }
          let command
          if (source === "Chocolatey") {
            command = `choco install ${appId} -y`
          } else {
            command = `winget install ${appId} --silent --accept-package-agreements --accept-source-agreements`
          }

          sendToRenderer("install-start", { appId })
          const result = await executePowerShellStreaming({
            script: command,
            name: `Install-${appId}`,
            appId,
          })
          const isChocoFailure =
            source === "Chocolatey" &&
            !result.success &&
            result.output &&
            !result.output.includes("already installed")

          if (result.success || (result.output && result.output.includes("already installed"))) {
            console.log(`Successfully installed ${appId}`)
            sendToRenderer("install-app-complete", { appId })
          } else if (isChocoFailure) {
            console.log(`Initial install failed for ${appId}, retrying with --pre flag`)
            sendToRenderer("install-output", { appId, line: "\nRetrying with --pre flag...\n" })
            const retryCommand = `choco install ${appId} -y --pre`
            const retryResult = await executePowerShellStreaming({
              script: retryCommand,
              name: `Install-${appId}-pre`,
              appId,
            })

            if (
              retryResult.success ||
              (retryResult.output && retryResult.output.includes("already installed"))
            ) {
              console.log(`Successfully installed ${appId} with --pre flag`)
              sendToRenderer("install-app-complete", { appId })
            } else {
              console.error(`Failed to install ${appId} even with --pre flag:`, retryResult.error)
              sendToRenderer("install-app-error", { appId })
            }
          } else {
            console.error(`Failed to install ${appId}:`, result.error)
            sendToRenderer("install-app-error", { appId })
          }
        }
        sendToRenderer("install-complete")
        break

      case "uninstall":
        for (const appId of apps) {
          if (!isSafeId(appId)) {
            console.error(`Rejected unsafe app ID: ${appId}`)
            sendToRenderer("install-app-error", { appId })
            continue
          }
          let command
          if (source === "Chocolatey") {
            command = `choco uninstall ${appId} -y`
          } else {
            command = `winget uninstall ${appId} --silent`
          }

          sendToRenderer("install-start", { appId })
          const result = await executePowerShellStreaming({
            script: command,
            name: `Uninstall-${appId}`,
            appId,
          })

          if (result.success) {
            console.log(`Successfully uninstalled ${appId}`)
            sendToRenderer("install-app-complete", { appId })
          } else {
            console.error(`Failed to uninstall ${appId}:`, result.error)
            sendToRenderer("install-app-error", { appId })
          }
        }
        sendToRenderer("install-complete")
        break

      case "check-installed":
        try {
          const result = await executePowerShell({
            script: "winget list",
            name: "check-installed",
          })

          if (!result.success) {
            throw new Error(result.error)
          }

          const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          }

          const installedAppIds = apps.filter((appId) => {
            const regex = new RegExp(`\\b${escapeRegExp(appId)}\\b`, "i")
            return regex.test(result.output ?? "")
          })

          if (mainWindow) {
            mainWindow.webContents.send("installed-apps-checked", {
              success: true,
              installed: installedAppIds,
            })
          }
        } catch (error) {
          console.error("Failed to check installed apps:", error)
          if (mainWindow) {
            mainWindow.webContents.send("installed-apps-checked", {
              success: false,
              error: (error as any).message,
            })
          }
        }
        break

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
