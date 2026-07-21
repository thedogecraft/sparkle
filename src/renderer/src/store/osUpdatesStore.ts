import { create } from "zustand"
import { invoke } from "@/lib/electron"
import useAppInstallStore from "./appInstallStore"
import type { WindowsUpdateItem } from "@/types/index"

interface CheckResult {
  success: boolean
  updates: WindowsUpdateItem[]
  error?: string
}

interface OsUpdatesState {
  updates: WindowsUpdateItem[]
  checking: boolean
  installing: boolean
  lastChecked: number | null
  error: string | null
  check: () => Promise<void>
  install: (targets: WindowsUpdateItem[]) => Promise<void>
}

// Deliberately not checked at app launch like appUpdatesStore -- a WU search
// takes 15-25s (COM, not a fast CLI call), so it only runs when the Apps tab
// of the App Updates page is actually opened.
const useOsUpdatesStore = create<OsUpdatesState>((set, get) => ({
  updates: [],
  checking: false,
  installing: false,
  lastChecked: null,
  error: null,

  check: async () => {
    if (get().checking) return
    set({ checking: true, error: null })
    try {
      const result = (await invoke({ channel: "os-updates:check" })) as CheckResult
      set({
        updates: result?.updates ?? [],
        error: result?.success ? null : (result?.error ?? "Failed to check for Windows updates"),
        lastChecked: Date.now(),
      })
    } catch (err: any) {
      set({ error: err?.message ?? "Failed to check for Windows updates", lastChecked: Date.now() })
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
      await invoke({ channel: "os-updates:install", payload: { updateIds: targets.map((t) => t.updateId) } })
    } finally {
      set({ installing: false })
      await get().check()
    }
  },
}))

export default useOsUpdatesStore
