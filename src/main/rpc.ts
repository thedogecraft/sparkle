import { ipcMain } from "electron"
import discordRPC from "discord-rpc"
import { logo } from "./index"
import jsonData from "../../package.json"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

const clientId = "1188686354490609754"
let rpcClient: discordRPC.Client | null = null
let isInitializing = false
let initRetryCount = 0
const MAX_RETRIES = 3

async function startDiscordRPC(): Promise<boolean> {
  if (isInitializing || rpcClient) {
    return false
  }

  if (initRetryCount >= MAX_RETRIES) {
    console.warn("(rpc.js) ", "Max Discord RPC retries reached, giving up")
    return false
  }

  isInitializing = true
  initRetryCount++

  setTimeout(async () => {
    try {
      rpcClient = new discordRPC.Client({ transport: "ipc" })

      rpcClient.on("ready", () => {
        console.log("(rpc.js) ", logo, "Discord RPC connected")
        isInitializing = false
        initRetryCount = 0

        rpcClient!
          .setActivity({
            details: "Optimizing your PC",
            state: `Running Sparkle v${jsonData.version || "2"}`,
            buttons: [
              // keep this as parcoil incase of the domain going down
              { label: "Download Sparkle", url: "https://parcoil.com/sparkle" },
              { label: "Join Discord", url: "https://discord.com/invite/En5YJYWj3Z" },
            ],
            largeImageKey: "sparklelogo",
            largeImageText: "Sparkle Optimizer",
            instance: false,
          })
          .catch((err: Error) => {
            console.warn("(rpc.js) ", "Failed to set Discord RPC activity:", err.message)
          })
      })

      rpcClient.on("error", (error: Error) => {
        console.warn("(rpc.js) ", "Discord RPC error:", error.message)
        isInitializing = false
        stopDiscordRPC()
      })

      await rpcClient.login({ clientId }).catch((error: Error) => {
        console.warn("(rpc.js) ", "Discord RPC login failed:", error.message)
        isInitializing = false
        stopDiscordRPC()
      })
    } catch (error: any) {
      console.warn("(rpc.js) ", "Failed to initialize Discord RPC:", error.message)
      isInitializing = false
      stopDiscordRPC()
    }
  }, 1000)

  return true
}

function stopDiscordRPC(): boolean {
  if (rpcClient) {
    try {
      rpcClient.destroy()
    } catch {
      // ignore errors when transport is already closed
    }
    rpcClient = null
    console.log("(rpc.js) ", "Discord RPC disconnected")
  }
  isInitializing = false
  return true
}

ipcMain.handle("start-discord-rpc", () => {
  return startDiscordRPC()
})

ipcMain.handle("stop-discord-rpc", () => {
  return stopDiscordRPC()
})

export { startDiscordRPC, stopDiscordRPC }
