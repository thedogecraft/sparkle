import { ipcMain } from "electron"
import { Client, PresenceBuilder, ActivityType } from "discord-rpc-new"
import jsonData from "../../package.json"
import log from "electron-log"
import Store from "electron-store"

const store = new Store()

const clientId = "1188686354490609754"
let rpcClient: Client | null = null
let isInitializing = false
let initRetryCount = 0
const MAX_RETRIES = 3

async function startDiscordRPC(): Promise<boolean> {
  if (isInitializing || rpcClient) {
    return false
  }

  if (initRetryCount >= MAX_RETRIES) {
    log.warn("(rpc) Max Discord RPC retries reached, giving up")
    return false
  }

  isInitializing = true
  initRetryCount++

  setTimeout(async () => {
    try {
      rpcClient = new Client()

      rpcClient.on("READY", () => {
        log.log("(rpc) Discord RPC connected")
        isInitializing = false
        initRetryCount = 0

        const activity = new PresenceBuilder()
          .setType(ActivityType.Playing)
          .setDetails("Optimizing your PC")
          .setState(`Running Sparkle v${jsonData.version ?? "2"}`)
          .setLargeImage("sparklelogo", "Sparkle Debloat")
          .addButton("Download Sparkle", "https://parcoil.com/sparkle")
          .addButton("Join Discord", "https://discord.com/invite/En5YJYWj3Z")
          .build()

        if (!rpcClient || !activity) return

        try {
          rpcClient.setActivity(activity)
          log.log("(rpc) Activity set successfully")
        } catch (err: any) {
          log.warn("(rpc) Failed to set Discord RPC activity:", err.message)
        }
      })

      rpcClient.on("disconnected", () => {
        log.log("(rpc) Discord RPC disconnected")
      })

      rpcClient.on("close", () => {
        log.log("(rpc) Discord RPC connection closed")
      })

      rpcClient.on("ERROR", (error: Error) => {
        log.warn("(rpc) Discord RPC error:", error.message)
        isInitializing = false
        stopDiscordRPC().catch(() => {})
      })

      await rpcClient.login({ clientId }).catch((error: Error) => {
        log.warn("(rpc) Discord RPC login failed:", error.message)
        isInitializing = false
        stopDiscordRPC().catch(() => {})
      })
    } catch (error: any) {
      log.warn("(rpc) Failed to initialize Discord RPC:", error.message)
      isInitializing = false
      stopDiscordRPC().catch(() => {})
    }
  }, 1000)

  return true
}

async function stopDiscordRPC(): Promise<boolean> {
  if (!rpcClient) {
    return true
  }

  const client = rpcClient
  rpcClient = null
  isInitializing = false

  try {
    await client.destroy()
  } catch (error: any) {
    log.warn("(rpc) Error stopping Discord RPC:", error.message)
  }

  log.log("(rpc) Discord RPC disconnected")
  return true
}

ipcMain.handle("start-discord-rpc", () => {
  return startDiscordRPC()
})

ipcMain.handle("stop-discord-rpc", () => {
  return stopDiscordRPC()
})

ipcMain.handle("rpc-enabled:get", () => {
  return store.get("rpcEnabled") !== false
})

ipcMain.handle("rpc-enabled:set", (_event, value: boolean) => {
  store.set("rpcEnabled", value)
  if (value) {
    startDiscordRPC()
  } else {
    stopDiscordRPC()
  }
  return value
})

export { startDiscordRPC, stopDiscordRPC }
