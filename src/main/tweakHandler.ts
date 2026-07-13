import { ipcMain, IpcMainInvokeEvent } from "electron"
import fs from "fs/promises"
import path from "path"
import { app } from "electron"
import { getSidecar } from "@main/sidecar"
import { detectGPU } from "@main/gpu"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

const isDev = !app.isPackaged
const tweaksDir = isDev ? path.join(process.cwd(), "tweaks") : path.join(app.getAppPath(), "tweaks")

interface Tweak {
  name: string
  psapply: string
  psunapply: string
  category?: string | string[]
  description?: string
  [key: string]: any
}

async function loadTweaks(): Promise<Tweak[]> {
  const entries = await fs.readdir(tweaksDir, { withFileTypes: true })
  const tweaks: Tweak[] = []
  for (const dir of entries) {
    if (!dir.isDirectory()) continue

    const name = dir.name
    const folder = path.join(tweaksDir, name)

    const applyPath = path.join(folder, "apply.ps1")
    const metaPath = path.join(folder, "meta.json")

    const hasMeta = await fs
      .access(metaPath)
      .then(() => true)
      .catch(() => false)

    if (!hasMeta) continue

    const unapplyPath = path.join(folder, "unapply.ps1")

    let psapply = ""
    let psunapply = ""

    try {
      psapply = await fs.readFile(applyPath, "utf8")
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.warn(`Error reading apply.ps1 for tweak: ${name}`, error)
      }
    }

    try {
      psunapply = await fs.readFile(unapplyPath, "utf8")
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.warn(`Error reading unapply.ps1 for tweak: ${name}`, error)
      }
    }

    let meta: any = {}

    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf8"))
    } catch (error) {
      console.warn(`Error reading meta.json for tweak: ${name}`, error)
      continue
    }

    tweaks.push({
      name,
      psapply,
      psunapply: psunapply || "",
      ...meta,
    })
  }
  return tweaks
}

function getCategories(tweak: Tweak): string[] {
  if (!tweak.category) return []
  if (Array.isArray(tweak.category)) return tweak.category
  return [tweak.category]
}

function isGPUTweak(tweak: Tweak): boolean {
  return getCategories(tweak).includes("GPU")
}

function isNvidiaTweak(tweak: Tweak): boolean {
  return tweak.name === "optimize-nvidia-settings"
}

export const setupTweaksHandlers = (): void => {
  ipcMain.handle("tweak-states:load", async (): Promise<string> => {
    const sidecar = getSidecar()
    const result = await sidecar.request("tweak.states.load")
    return typeof result === "string" ? result : JSON.stringify(result)
  })

  ipcMain.handle(
    "tweak-states:save",
    async (_event: IpcMainInvokeEvent, payload: string): Promise<boolean> => {
      const sidecar = getSidecar()
      await sidecar.request("tweak.states.save", { data: payload })
      return true
    },
  )

  ipcMain.handle("tweaks:fetch", async (): Promise<Tweak[]> => {
    return await loadTweaks()
  })

  ipcMain.handle("tweak:apply", async (_: any, name: string): Promise<any> => {
    const tweaks = await loadTweaks()
    const tweak = tweaks.find((t) => t.name === name)
    if (!tweak) {
      throw new Error(`No apply script found for tweak: ${name}`)
    }

    if (isGPUTweak(tweak) || isNvidiaTweak(tweak)) {
      const gpuInfo = await detectGPU()
      if (isGPUTweak(tweak) && !gpuInfo.hasGPU) {
        throw new Error(`This tweak requires a dedicated GPU, but no compatible GPU was detected.`)
      }
      if (isNvidiaTweak(tweak) && !gpuInfo.isNvidia) {
        throw new Error(`This tweak is only for NVIDIA GPUs, but no NVIDIA GPU was detected.`)
      }
    }

    if (name === "optimize-nvidia-settings") {
      const sidecar = getSidecar()
      return await sidecar.request("nvidia.inspector")
    }

    const sidecar = getSidecar()
    return await sidecar.request("tweak.apply", { name, script: tweak.psapply })
  })

  ipcMain.handle("tweak:unapply", async (_: any, name: string): Promise<any> => {
    const tweaks = await loadTweaks()
    const tweak = tweaks.find((t) => t.name === name)
    if (!tweak || !tweak.psunapply) {
      throw new Error(`No unapply script found for tweak: ${name}`)
    }

    const sidecar = getSidecar()
    return await sidecar.request("tweak.unapply", { name, script: tweak.psunapply })
  })

  ipcMain.handle("nvidia-inspector", (_: any, _args: any): Promise<any> => {
    const sidecar = getSidecar()
    return sidecar.request("nvidia.inspector")
  })

  ipcMain.handle("tweak:active", async (): Promise<string[]> => {
    const sidecar = getSidecar()
    const result = await sidecar.request("tweak.active")
    return result.active ?? []
  })

  console.log("[Sparkle main/tweakHandler.ts]: Tweak handlers setup complete")
}

export const cleanupTweaksHandlers = (): void => {
  ipcMain.removeHandler("tweak-states:load")
  ipcMain.removeHandler("tweak-states:save")
  ipcMain.removeHandler("tweaks:fetch")
  ipcMain.removeHandler("tweak:apply")
  ipcMain.removeHandler("tweak:unapply")
  ipcMain.removeHandler("nvidia-inspector")
  ipcMain.removeHandler("tweak:active")
}

export default {
  setupTweaksHandlers,
  cleanupTweaksHandlers,
}
