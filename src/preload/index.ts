import { contextBridge, ipcRenderer } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

const INVOKABLE_CHANNELS = new Set([
  // backup.ts
  "create-sparkle-restore-point",
  "create-restore-point",
  "delete-all-restore-points",
  "get-restore-points",
  "restore-restore-point",
  "delete-old-sparkle-backups",
  // debloat.ts
  "get-installed-apps",
  "reload-installed-apps",
  "uninstall-apps",
  // dnsHandler.ts
  "dns:get-current",
  "dns:apply",
  "dns:reset",
  "dns:test",
  "dns:ping-all",
  "dns:get-adapters",
  "dns:flush-cache",
  // index.ts
  "tray:get",
  "tray:set",
  "open-devtools",
  // powershell.ts
  "run-powershell-window",
  "run-powershell",
  "check-chocolatey",
  "install-chocolatey",
  "handle-apps",
  // system.ts
  "restart",
  "open-log-folder",
  "clear-sparkle-cache",
  "get-system-info",
  "get-user-name",
  "restart-explorer",
  "check-winget",
  "get-admin-status",
  "install-winget",
  "clear-standby-memory",
  // tweakHandler.ts
  "tweak-states:load",
  "tweak-states:save",
  "tweaks:fetch",
  "tweak:apply",
  "tweak:unapply",
  "nvidia-inspector",
  "tweak:active",
  // updates.ts
  "updater:get-version",
  "updater:check",
  "updater:download",
  "updater:install",
])

const SENDABLE_CHANNELS = new Set(["window-minimize", "window-toggle-maximize", "window-close"])

const restrictedIpcRenderer = {
  ...electronAPI.ipcRenderer,
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    if (!INVOKABLE_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`Blocked invoke on unknown channel: ${channel}`))
    }
    return ipcRenderer.invoke(channel, ...args)
  },
  send: (channel: string, ...args: any[]): void => {
    if (!SENDABLE_CHANNELS.has(channel)) {
      throw new Error(`Blocked send on unknown channel: ${channel}`)
    }
    return ipcRenderer.send(channel, ...args)
  },
}

const restrictedElectronAPI = {
  ...electronAPI,
  ipcRenderer: restrictedIpcRenderer,
}

const api = {}
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", restrictedElectronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as any).electron = restrictedElectronAPI
  ;(window as any).api = api
}
