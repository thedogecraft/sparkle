import { ipcMain } from "electron"
import { Client, PresenceBuilder, ActivityType } from "discord-rpc-new"
import jsonData from "../../package.json"
import log from "electron-log"
import Store from "electron-store"

const store = new Store()

const CLIENT_ID = "1188686354490609754"

// using patched discord-rpc-new package
const MAX_RECONNECT_ATTEMPTS = 3

let client: Client | null = null

function buildActivity() {
  return new PresenceBuilder()
    .setType(ActivityType.Playing)
    .setDetails("Optimizing your PC")
    .setState(`Running Sparkle v${jsonData.version ?? "2"}`)
    .setLargeImage("sparklelogo", "Sparkle Debloat")
    .addButton("Download Sparkle", "https://parcoil.com/sparkle")
    .addButton("Join Discord", "https://discord.com/invite/En5YJYWj3Z")
    .build()
}

async function startDiscordRPC(): Promise<boolean> {
  if (client) {
    return false // already connected or connecting
  }

  const rpc = new Client({ maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS })
  client = rpc

  rpc.on("READY", () => {
    log.log("(rpc) Discord RPC connected")

    try {
      rpc.setActivity(buildActivity())
      log.log("(rpc) Activity set successfully")
    } catch (err: any) {
      log.warn("(rpc) Failed to set Discord RPC activity:", err.message)
    }
  })

  rpc.on("disconnected", () => log.log("(rpc) Discord RPC disconnected"))
  rpc.on("close", () => log.log("(rpc) Discord RPC connection closed"))
  rpc.on("ERROR", (error: Error) => log.warn("(rpc) Discord RPC error:", error.message))

  try {
    await rpc.login({ clientId: CLIENT_ID })
  } catch (error: any) {
    log.warn("(rpc) Discord RPC initialization failed:", error.message)
    await stopDiscordRPC()
  }

  return true
}

async function stopDiscordRPC(): Promise<boolean> {
  if (!client) {
    return true
  }

  const current = client
  client = null

  try {
    await current.destroy()
  } catch (error: any) {
    log.warn("(rpc) Error stopping Discord RPC:", error.message)
  }

  log.log("(rpc) Discord RPC disconnected")
  return true
}

ipcMain.handle("start-discord-rpc", () => startDiscordRPC())
ipcMain.handle("stop-discord-rpc", () => stopDiscordRPC())

ipcMain.handle("rpc-enabled:get", () => store.get("rpcEnabled") !== false)

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
