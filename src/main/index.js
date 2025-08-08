import { app, shell, BrowserWindow, ipcMain, globalShortcut } from "electron"
import path, { join } from "path"

import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import * as Sentry from "@sentry/electron/main"
import { IPCMode } from "@sentry/electron/main"
import fs from "fs"
import log from "electron-log"
import "./system"
import "./powershell"
import "./rpc"
import "./tweakHandler"
import "./dnsHandler"
import "./backup"
import UpdateHandler from "./updateHandler"
import { executePowerShell } from "./powershell"
import { createTray } from "./tray"
import { setupTweaksHandlers } from "./tweakHandler"
import { setupDNSHandlers } from "./dnsHandler"
import Store from "electron-store"
import { startDiscordRPC, stopDiscordRPC } from "./rpc"
import { autoUpdater } from "electron-updater"
Sentry.init({
  dsn: "https://d1e8991c715dd717e6b7b44dbc5c43dd@o4509167771648000.ingest.us.sentry.io/4509167772958720",
  ipcMode: IPCMode.Both,
})
console.log = log.log
console.error = log.error
console.warn = log.warn

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

export const logo = "[Sparkle]:"
log.initialize()
async function Defender() {
  const Apppath = path.dirname(process.execPath)
  if (app.isPackaged) {
    const result = await executePowerShell(null, {
      script: `Add-MpPreference -ExclusionPath ${Apppath}`,
      name: "Add-MpPreference",
    })
    if (result.success) {
      console.log(logo, "Added Sparkle to Windows Defender Exclusions")
    } else {
      console.error(logo, "Failed to add Sparkle to Windows Defender Exclusions", result.error)
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

store.set("discord-rpc", false)
if (store.get("discord-rpc") !== true) {
  store.set("discord-rpc", true)
  startDiscordRPC()
  console.log("(main.js) ", logo, "Starting Discord RPC")
}

ipcMain.handle("discord-rpc:toggle", async (event, value) => {
  if (value) {
    store.set("discord-rpc", true)
    startDiscordRPC()
    console.log(logo, "Starting Discord RPC")
  } else {
    store.set("discord-rpc", false)
    await stopDiscordRPC()
    console.log(logo, "Stopping Discord RPC")
  }
  return store.get("discord-rpc")
})
ipcMain.handle("discord-rpc:get", () => {
  return store.get("discord-rpc")
})

export let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1203,
    backgroundColor: "#0f172a",
    height: 694,
    minWidth: 1203,
    minHeight: 694,
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

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
    if (store.get("showTray")) {
      trayInstance = createTray(mainWindow)
    }
    Defender()

    autoUpdater.checkForUpdatesAndNotify().catch(console.error)
    setInterval(
      () => {
        // ik theres a better way to do this but i will fix it later
        autoUpdater.checkForUpdatesAndNotify().catch(console.error)
      },
      15 * 60 * 1000,
    )
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
}

app.whenReady().then(() => {
  createWindow()
  setupTweaksHandlers()
  setupDNSHandlers()
  new UpdateHandler()
  if (app.isPackaged) {
    globalShortcut.register("CommandOrControl+R", () => {})
    globalShortcut.register("F5", () => {})
    globalShortcut.register("CommandOrControl+Shift+R", () => {})
  }
  autoUpdater.on("update-available", () => {
    console.log(logo, "Update available.")
  })

  autoUpdater.on("update-not-available", () => {
    console.log(logo, "No update available.")
  })

  autoUpdater.on("error", (err) => {
    console.error(logo, "Error in auto-updater:", err)
  })

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
