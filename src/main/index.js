import { app, shell, BrowserWindow, ipcMain } from "electron"
import path, { join } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import * as Sentry from "@sentry/electron/main"
import { IPCMode } from "@sentry/electron/main"
import log from "electron-log"
import "./system"
import "./powershell"
import "./rpc"
import "./tweakHandler"
import "./dnsHandler"
import "./backup"
import { executePowerShell } from "./powershell"
import { createTray } from "./tray"
import { setupTweaksHandlers } from "./tweakHandler"
import { setupDNSHandlers } from "./dnsHandler"
import { setupPermissionHandlers } from "./permissionHandlers.js"
import { logger } from "./logger.js"
import Store from "electron-store"
import { startDiscordRPC, stopDiscordRPC } from "./rpc"
import { initAutoUpdater, triggerAutoUpdateCheck } from "./updates.js"
import { ensureWinget } from "./system"
Sentry.init({
  dsn: "https://d1e8991c715dd717e6b7b44dbc5c43dd@o4509167771648000.ingest.us.sentry.io/4509167772958720",
  ipcMode: IPCMode.Both,
})

// Initialize structured logger (this redirects console to logger)
logger.initializeLogging()

export const logo = "[Sparkle]:"
log.initialize()

// Setup permission handlers
setupPermissionHandlers()
async function Defender() {
  const Apppath = path.dirname(process.execPath)
  if (app.isPackaged) {
    const result = await executePowerShell(null, {
      script: `
        if (Get-Command Add-MpPreference -ErrorAction SilentlyContinue) {
          Add-MpPreference -ExclusionPath '${Apppath}'
          Write-Output "Success"
        } else {
          Write-Output "Skipped"
        }
      `,
      name: "Add-MpPreference",
    })

    if (result.output && result.output.includes("Skipped")) {
      console.log(logo, "Skipped Windows Defender exclusion (Defender not found)")
    } else {
      console.log(logo, "Added Sparkle to Windows Defender Exclusions")
    }
  } else {
    console.log(logo, "Running in development mode, skipping Windows Defender exclusion")
  }
}

const store = new Store()

let trayInstance = null
if (store.get("showTray") === undefined) {
  store.set("showTray", true)
}

ipcMain.handle("tray:get", () => {
  return store.get("showTray")
})
ipcMain.handle("tray:set", (event, value) => {
  store.set("showTray", value)
  if (mainWindow) {
    if (value) {
      if (!trayInstance) {
        trayInstance = createTray(mainWindow)
      }
    } else {
      if (trayInstance) {
        trayInstance.destroy()
        trayInstance = null
      }
    }
  }
  return store.get("showTray")
})

const initDiscordRPC = async () => {
  if (store.get("discord-rpc") === undefined) {
    store.set("discord-rpc", true)
    console.log("(main.js) ", logo, "Starting Discord RPC")
    await startDiscordRPC()
  } else if (store.get("discord-rpc") === true) {
    console.log("(main.js) ", logo, "Starting Discord RPC (from settings)")
    await startDiscordRPC()
  }
}

initDiscordRPC().catch((err) => {
  console.warn("(main.js) ", "Failed to initialize Discord RPC:", err.message)
})

ipcMain.handle("discord-rpc:toggle", async (event, value) => {
  try {
    if (value) {
      store.set("discord-rpc", true)
      console.log(logo, "Starting Discord RPC")
      await startDiscordRPC()
    } else {
      store.set("discord-rpc", false)
      console.log(logo, "Stopping Discord RPC")
      await stopDiscordRPC()
    }
    return { success: true, enabled: store.get("discord-rpc") }
  } catch (error) {
    console.error(logo, "Error toggling Discord RPC:", error)
    return {
      success: false,
      error: error.message,
      enabled: store.get("discord-rpc"),
    }
  }
})
ipcMain.handle("discord-rpc:get", () => {
  return store.get("discord-rpc")
})

export let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    backgroundColor: "#0c121f",
    height: 760,
    // minWidth: 1380,
    // minHeight: 760,
    minWidth: 790,
    center: true,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../../resources/sparkle2.ico"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      devTools: app.isPackaged ? false : true,
      sandbox: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  createWindow()
  initAutoUpdater(() => mainWindow)
  if (store.get("showTray")) {
    setTimeout(() => {
      trayInstance = createTray(mainWindow)
    }, 50)
  }
  setTimeout(() => {
    void triggerAutoUpdateCheck()
  }, 1500)

  setTimeout(() => {
    void Defender()
    void ensureWinget()
    setupTweaksHandlers()
    setupDNSHandlers()
  }, 0)

  electronApp.setAppUserModelId("com.parcoil.sparkle")

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on("window-minimize", () => {
    if (mainWindow) mainWindow.minimize()
  })

  ipcMain.on("window-toggle-maximize", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.on("window-close", () => {
    if (mainWindow) {
      if (store.get("showTray")) {
        mainWindow.hide()
      } else {
        app.quit()
      }
    }
  })

  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()
  } else {
    app.on("second-instance", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    })
  }
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
