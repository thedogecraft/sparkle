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

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export async function executePowerShell(_, props) {
  const { script, name = "script" } = props

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

    console.log(`PowerShell stdout [${name}]:`, stdout)

    return { success: true, output: stdout }
  } catch (error: any) {
    console.error(`PowerShell execution error [${name}]:`, error)
    return { success: false, error: error.message }
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

export function executePowerShellStreaming(
  _,
  { script, name = "script", appId }: { script: string; name: string; appId: string }
): Promise<{ success: boolean; output?: string; error?: string }> {
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

async function runPowerShellInWindow(_, { script, name = "script", noExit = true }) {
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
  } catch (error: any) {
    console.error(`Error in runPowerShellInWindow [${name}]:`, error)
    return { success: false, error: error.message }
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
  ipcMain.handle("run-powershell-window", runPowerShellInWindow)
  ipcMain.handle("run-powershell", executePowerShell)
  ipcMain.handle("check-chocolatey", async () => checkChocolatey())
  ipcMain.handle("install-chocolatey", async (event) => {
    try {
      const result = await executePowerShell(event, {
        script: "winget install --id chocolatey.chocolatey --source winget",
        name: "install-chocolatey",
      })
      if (result.success) {
        return { installed: true, version: (result as any).output.trim() }
      } else {
        return { installed: false }
      }
    } catch (error) {
      console.error("Error installing Chocolatey:", error)
      return { installed: false }
    }
  })
  ipcMain.handle("handle-apps", async (event, { action, apps, source }) => {
    switch (action) {
      case "install":
        for (const appId of apps) {
          let command
          if (source === "Chocolatey") {
            command = `choco install ${appId} -y`
          } else {
            command = `winget install ${appId} --silent --accept-package-agreements --accept-source-agreements`
          }

          sendToRenderer("install-start", { appId })
          const result = await executePowerShellStreaming(event, {
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
            const retryResult = await executePowerShellStreaming(event, {
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
          let command
          if (source === "Chocolatey") {
            command = `choco uninstall ${appId} -y`
          } else {
            command = `winget uninstall ${appId} --silent`
          }

          sendToRenderer("install-start", { appId })
          const result = await executePowerShellStreaming(event, {
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
          const result = await executePowerShell(event, {
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
            return regex.test((result as any).output)
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
