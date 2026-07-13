import { ChildProcess, spawn } from "child_process"
import { randomUUID } from "crypto"
import path from "path"
import { app } from "electron"
import log from "electron-log"
import readline from "readline"

console.log = log.log
console.error = log.error
console.warn = log.warn

interface PendingRequest {
  resolve: (value: any) => void
  reject: (reason: any) => void
  timeout: ReturnType<typeof setTimeout>
}

interface SidecarEvent {
  event: string
  data: any
}

class SidecarClient {
  private process: ChildProcess | null = null
  private pending = new Map<string, PendingRequest>()
  private eventHandlers = new Map<string, Array<(data: any) => void>>()
  private ready = false
  private readyPromise: Promise<void>
  private readyResolve!: () => void
  private requestTimeout = 30_000
  private restartDelay = 1000
  private maxRestartDelay = 30_000
  private currentRestartDelay = 1000
  private rl: readline.Interface | null = null
  private resourcesPath: string

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve
    })

    const isDev = !app.isPackaged
    this.resourcesPath = isDev
      ? path.resolve(process.cwd(), "resources")
      : process.resourcesPath
  }

  async start(): Promise<void> {
    const exePath = this.getExePath()
    log.info(`[Sidecar] Starting sidecar from: ${exePath}`)

    this.process = spawn(exePath, [
      "--resources-path", this.resourcesPath,
    ], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    })

    this.process.on("error", (err) => {
      log.error("[Sidecar] Process error:", err)
      this.handleCrash()
    })

    this.process.on("exit", (code, signal) => {
      log.warn(`[Sidecar] Process exited with code=${code} signal=${signal}`)
      this.handleCrash()
    })

    this.process.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim()
      if (msg) log.warn("[Sidecar stderr]:", msg)
    })

    this.rl = readline.createInterface({
      input: this.process.stdout!,
      crlfDelay: Infinity,
    })

    this.rl.on("line", (line: string) => {
      this.handleLine(line)
    })

    this.rl.on("close", () => {
      log.warn("[Sidecar] stdout closed")
    })

    await this.readyPromise
    log.info("[Sidecar] Sidecar is ready")
  }

  stop(): void {
    this.restartDelay = this.maxRestartDelay
    if (this.rl) {
      this.rl.close()
      this.rl = null
    }
    if (this.process) {
      this.process.kill()
      this.process = null
    }
    this.ready = false
    for (const [, req] of this.pending) {
      clearTimeout(req.timeout)
      req.reject(new Error("Sidecar stopped"))
    }
    this.pending.clear()
  }

  async request(method: string, params?: any): Promise<any> {
    if (!this.ready) {
      await this.readyPromise
    }

    const id = randomUUID()
    const message = JSON.stringify({ id, method, params: params ?? null })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Sidecar request timed out: ${method}`))
      }, this.requestTimeout)

      this.pending.set(id, { resolve, reject, timeout })

      this.process?.stdin?.write(message + "\n", (err) => {
        if (err) {
          clearTimeout(timeout)
          this.pending.delete(id)
          reject(new Error(`Failed to write to sidecar: ${err.message}`))
        }
      })
    })
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx >= 0) handlers.splice(idx, 1)
    }
  }

  private handleLine(line: string): void {
    let parsed: any
    try {
      parsed = JSON.parse(line)
    } catch {
      log.warn("[Sidecar] Invalid JSON:", line)
      return
    }

    if (parsed.event) {
      this.handleEvent(parsed.event, parsed.result)
      return
    }

    if (parsed.id && this.pending.has(parsed.id)) {
      const req = this.pending.get(parsed.id)!
      clearTimeout(req.timeout)
      this.pending.delete(parsed.id)

      if (parsed.error) {
        req.reject(new Error(parsed.error))
      } else {
        req.resolve(parsed.result)
      }
      return
    }
  }

  private handleEvent(event: string, data: any): void {
    if (event === "sidecar.ready") {
      this.ready = true
      this.currentRestartDelay = this.restartDelay
      this.readyResolve()
    }

    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(data)
      }
    }
  }

  private handleCrash(): void {
    this.ready = false
    this.pending.clear()

    log.warn(`[Sidecar] Restarting in ${this.currentRestartDelay}ms...`)
    setTimeout(() => {
      this.restartDelay = Math.min(this.currentRestartDelay * 2, this.maxRestartDelay)
      this.readyPromise = new Promise((resolve) => {
        this.readyResolve = resolve
      })
      this.start().catch((err) => {
        log.error("[Sidecar] Failed to restart:", err)
      })
    }, this.currentRestartDelay)
  }

  private getExePath(): string {
    const isDev = !app.isPackaged
    if (isDev) {
      return path.resolve(process.cwd(), "sidecar", "publish", "SparkleSidecar.exe")
    }
    return path.join(process.resourcesPath, "SparkleSidecar.exe")
  }
}

let instance: SidecarClient | null = null

export function getSidecar(): SidecarClient {
  if (!instance) {
    instance = new SidecarClient()
  }
  return instance
}

export type { SidecarClient }
