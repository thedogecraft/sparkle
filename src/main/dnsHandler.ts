import { ipcMain, IpcMainInvokeEvent } from "electron"
import { getSidecar } from "@main/sidecar"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

interface DNSResult {
  success: boolean
  data?: any
  error?: string
}

interface ApplyDNSProps {
  dnsType: string
  primaryDNS?: string
  secondaryDNS?: string
}

interface TestDNSProps {
  hostname?: string
}

interface PingResult {
  name: string
  server: string
  latency: number | null
  status: "success" | "timeout" | "error"
}

export const setupDNSHandlers = (): void => {
  ipcMain.handle("dns:get-current", async (): Promise<DNSResult> => {
    const sidecar = getSidecar()
    return await sidecar.request("dns.getCurrent")
  })

  ipcMain.handle(
    "dns:apply",
    async (_event: IpcMainInvokeEvent, props: ApplyDNSProps): Promise<any> => {
      const sidecar = getSidecar()
      return await sidecar.request("dns.apply", props)
    },
  )

  ipcMain.handle("dns:reset", async (): Promise<any> => {
    const sidecar = getSidecar()
    return await sidecar.request("dns.reset")
  })

  ipcMain.handle(
    "dns:test",
    async (_event: IpcMainInvokeEvent, props: TestDNSProps): Promise<any> => {
      const sidecar = getSidecar()
      return await sidecar.request("dns.test", props)
    },
  )

  ipcMain.handle(
    "dns:ping-all",
    async (): Promise<{ success: boolean; data?: PingResult[]; error?: string }> => {
      const sidecar = getSidecar()
      return await sidecar.request("dns.pingAll")
    },
  )

  ipcMain.handle("dns:get-adapters", async (): Promise<DNSResult> => {
    const sidecar = getSidecar()
    return await sidecar.request("dns.getAdapters")
  })

  ipcMain.handle("dns:flush-cache", async (): Promise<any> => {
    const sidecar = getSidecar()
    return await sidecar.request("dns.flushCache")
  })

  console.log("[Sparkle main/dnsHandler.ts]: DNS handlers setup complete")
}

export const cleanupDNSHandlers = (): void => {
  ipcMain.removeHandler("dns:get-current")
  ipcMain.removeHandler("dns:apply")
  ipcMain.removeHandler("dns:reset")
  ipcMain.removeHandler("dns:test")
  ipcMain.removeHandler("dns:ping-all")
  ipcMain.removeHandler("dns:get-adapters")
  ipcMain.removeHandler("dns:flush-cache")
}

export default {
  setupDNSHandlers,
  cleanupDNSHandlers,
}
