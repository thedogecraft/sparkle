import { ipcMain, app, IpcMainInvokeEvent } from "electron"
import fs from "fs/promises"
import fsSync from "fs"
import path from "path"
import { exec } from "child_process"
import { logo } from "@main/index"
import { executePowerShell } from "@main/powershell"
import si from "systeminformation"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

const userDataPath = app.getPath("userData")
const tweaksStatePath = path.join(userDataPath, "tweakStates.json")
const isDev = !app.isPackaged
const tweaksDir = isDev ? path.join(process.cwd(), "tweaks") : path.join(app.getAppPath(), "tweaks")

interface Tweak {
  name: string
  psapply: string
  psunapply: string
  category?: string
  description?: string
  [key: string]: any
}

interface GPUInfo {
  hasGPU: boolean
  isNvidia: boolean
  model: string | null
}

const getExePath = (exeName: string): string => {
  if (isDev) {
    return path.resolve(process.cwd(), "resources", exeName)
  }
  return path.join(process.resourcesPath, exeName)
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

const getNipPath = (): string => {
  if (isDev) {
    return path.resolve(process.cwd(), "resources", "sparklenvidia.nip")
  }
  return path.join(process.resourcesPath, "sparklenvidia.nip")
}

async function detectGPU(): Promise<GPUInfo> {
  try {
    const graphicsData = await si.graphics()
    if (!graphicsData.controllers || graphicsData.controllers.length === 0) {
      return { hasGPU: false, isNvidia: false, model: null }
    }

    const dedicatedControllers = graphicsData.controllers.filter((controller: any) => {
      const model = (controller.model || "").toLowerCase()
      const isIntegrated =
        model.includes("integrated") ||
        (model.includes("intel") &&
          (model.includes("hd") || model.includes("uhd") || model.includes("iris"))) ||
        (model.includes("amd") && model.includes("radeon") && model.includes("graphics"))

      return (
        !isIntegrated &&
        (model.includes("nvidia") ||
          (model.includes("amd") &&
            (model.includes("radeon") ||
              model.includes("rx") ||
              model.includes("vega") ||
              model.includes("firepro") ||
              model.includes("instinct"))) ||
          (model.includes("intel") && model.includes("arc")))
      )
    })

    const dedicatedGPU = dedicatedControllers.sort(
      (a: any, b: any) => (b.vram || 0) - (a.vram || 0),
    )[0]

    const hasGPU = !!dedicatedGPU
    const isNvidia = hasGPU && dedicatedGPU.model.toLowerCase().includes("nvidia")

    return {
      hasGPU,
      isNvidia,
      model: dedicatedGPU?.model || null,
    }
  } catch (error) {
    console.error("Error detecting GPU:", error)
    return { hasGPU: false, isNvidia: false, model: null }
  }
}

function isGPUTweak(tweak: Tweak): boolean {
  return !!(tweak.category && tweak.category.includes("GPU"))
}

function isNvidiaTweak(tweak: Tweak): boolean {
  return tweak.name === "optimize-nvidia-settings"
}

function NvidiaProfileInspector(): Promise<string> {
  const exePath = getExePath("nvidiaProfileInspector.exe")
  const nipPath = getNipPath()

  return new Promise((resolve, reject) => {
    exec(`"${exePath}" -silentImport "${nipPath}"`, (error, stdout, stderr) => {
      console.log("stdout:", stdout)
      console.log("stderr:", stderr)
      if (error) {
        console.error("Error:", error)
        reject(error)
      } else {
        resolve(stdout || "Completed with no output.")
      }
    })
  })
}

export const setupTweaksHandlers = (): void => {
  ipcMain.handle("tweak-states:load", async (): Promise<string> => {
    try {
      await fs.access(tweaksStatePath)
      const data = await fs.readFile(tweaksStatePath, "utf8")
      return data
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return JSON.stringify({})
      }
      console.error("Error loading tweak states:", error)
      throw error
    }
  })

  ipcMain.handle(
    "tweak-states:save",
    async (_event: IpcMainInvokeEvent, payload: string): Promise<boolean> => {
      try {
        await fs.mkdir(path.dirname(tweaksStatePath), { recursive: true })
        await fs.writeFile(tweaksStatePath, payload, "utf8")
        return true
      } catch (error) {
        console.error("Error saving tweak states:", error)
        throw error
      }
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

    if (isGPUTweak(tweak)) {
      const gpuInfo = await detectGPU()
      if (!gpuInfo.hasGPU) {
        throw new Error(`This tweak requires a dedicated GPU, but no compatible GPU was detected.`)
      }
    }

    if (isNvidiaTweak(tweak)) {
      const gpuInfo = await detectGPU()
      if (!gpuInfo.isNvidia) {
        throw new Error(`This tweak is only for NVIDIA GPUs, but no NVIDIA GPU was detected.`)
      }
    }

    if (name === "optimize-nvidia-settings") {
      console.log(logo, "Running Nvidia settings optimization...")
      NvidiaProfileInspector()
    } else {
      return executePowerShell(null, { script: tweak.psapply, name })
    }
  })

  ipcMain.handle("tweak:unapply", async (_: any, name: string): Promise<any> => {
    const tweaks = await loadTweaks()
    const tweak = tweaks.find((t) => t.name === name)
    if (!tweak || !tweak.psunapply) {
      throw new Error(`No unapply script found for tweak: ${name}`)
    }
    return executePowerShell(null, { script: tweak.psunapply, name })
  })

  ipcMain.handle("nvidia-inspector", (_: any, _args: any): Promise<string> => {
    return NvidiaProfileInspector()
  })

  ipcMain.handle("tweak:active", (): string[] => {
    return getActiveTweaks()
  })
  console.log("[Sparkle main/tweakHandler.ts]: Tweak handlers setup complete")
}

const getActiveTweaks = (): string[] => {
  try {
    const data = fsSync.readFileSync(tweaksStatePath, "utf8")
    const parsed = JSON.parse(data)
    return Object.keys(parsed).filter((key) => parsed[key])
  } catch (error) {
    console.error("Error loading tweak states:", error)
    return []
  }
}

export const cleanupTweaksHandlers = (): void => {
  ipcMain.removeHandler("tweak-states:load")
  ipcMain.removeHandler("tweak-states:save")
  ipcMain.removeHandler("tweaks:fetch")
  ipcMain.removeHandler("tweak:apply")
  ipcMain.removeHandler("tweak:unapply")
  ipcMain.removeHandler("nvidia-inspector")
}

export default {
  setupTweaksHandlers,
  cleanupTweaksHandlers,
}
