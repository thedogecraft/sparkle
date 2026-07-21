import { create } from "zustand"
import { invoke } from "@/lib/electron"
import useAppInstallStore from "./appInstallStore"
import type { WindowsUpdateItem, GpuDriverStatus, DriverVendorGroup } from "@/types/index"

interface DriverCheckResult {
  success: boolean
  updates: WindowsUpdateItem[]
  vendorGroups: DriverVendorGroup[]
  error?: string
}

interface GpuCheckResult extends GpuDriverStatus {
  success: boolean
  error?: string
}

interface DriverUpdatesState {
  updates: WindowsUpdateItem[]
  vendorGroups: DriverVendorGroup[]
  checking: boolean
  installing: boolean
  error: string | null

  gpu: GpuDriverStatus | null
  gpuChecking: boolean
  gpuError: string | null

  check: () => Promise<void>
  install: (targets: WindowsUpdateItem[]) => Promise<void>
  checkGpu: () => Promise<void>
}

const useDriverUpdatesStore = create<DriverUpdatesState>((set, get) => ({
  updates: [],
  vendorGroups: [],
  checking: false,
  installing: false,
  error: null,

  gpu: null,
  gpuChecking: false,
  gpuError: null,

  check: async () => {
    if (get().checking) return
    set({ checking: true, error: null })
    try {
      const result = (await invoke({ channel: "driver-updates:check" })) as DriverCheckResult
      set({
        updates: result?.updates ?? [],
        vendorGroups: result?.vendorGroups ?? [],
        error: result?.success ? null : (result?.error ?? "Failed to check for driver updates"),
      })
    } catch (err: any) {
      set({ error: err?.message ?? "Failed to check for driver updates" })
    } finally {
      set({ checking: false })
    }
  },

  install: async (targets) => {
    if (targets.length === 0 || get().installing) return
    const install = useAppInstallStore.getState()
    install.clearApps()
    install.setAction("update")
    targets.forEach((t) => install.addApp(t.updateId, t.title))

    set({ installing: true })
    try {
      await invoke({ channel: "driver-updates:install", payload: { updateIds: targets.map((t) => t.updateId) } })
    } finally {
      set({ installing: false })
      await get().check()
    }
  },

  checkGpu: async () => {
    if (get().gpuChecking) return
    set({ gpuChecking: true, gpuError: null })
    try {
      const result = (await invoke({ channel: "gpu-driver:check" })) as GpuCheckResult
      if (result?.success) {
        const { success: _success, error: _error, ...status } = result
        set({ gpu: status })
      } else {
        set({ gpuError: result?.error ?? "Failed to check GPU driver" })
      }
    } catch (err: any) {
      set({ gpuError: err?.message ?? "Failed to check GPU driver" })
    } finally {
      set({ gpuChecking: false })
    }
  },
}))

export default useDriverUpdatesStore
