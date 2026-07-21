import { create } from "zustand"
import { invoke } from "@/lib/electron"
import useAppInstallStore from "./appInstallStore"
import type { AppUpdate } from "@/types/index"

interface CheckResult {
  success: boolean
  wingetInstalled: boolean
  updates: AppUpdate[]
  error?: string
}

interface AppUpdatesState {
  updates: AppUpdate[]
  checking: boolean
  updating: boolean
  wingetInstalled: boolean | null
  lastChecked: number | null
  error: string | null
  check: () => Promise<void>
  upgrade: (targets: AppUpdate[]) => Promise<void>
}

// Lives in a store rather than the page so the nav badge can read it, and so
// an in-progress upgrade still refreshes the list if the user navigates away.
const useAppUpdatesStore = create<AppUpdatesState>((set, get) => ({
  updates: [],
  checking: false,
  updating: false,
  wingetInstalled: null,
  lastChecked: null,
  error: null,

  check: async () => {
    if (get().checking) return
    set({ checking: true, error: null })
    try {
      const result = (await invoke({ channel: "app-updates:check" })) as CheckResult
      set({
        updates: result?.updates ?? [],
        wingetInstalled: result?.wingetInstalled ?? null,
        error: result?.success ? null : (result?.error ?? "Failed to check for updates"),
        lastChecked: Date.now(),
      })
    } catch (err: any) {
      set({ error: err?.message ?? "Failed to check for updates", lastChecked: Date.now() })
    } finally {
      set({ checking: false })
    }
  },

  upgrade: async (targets) => {
    if (targets.length === 0 || get().updating) return
    const install = useAppInstallStore.getState()
    install.clearApps()
    install.setAction("update")
    targets.forEach((t) => install.addApp(t.id, t.name))

    set({ updating: true })
    try {
      await invoke({
        channel: "app-updates:upgrade",
        payload: {
          apps: targets.map(({ id, name, source, truncated }) => ({ id, name, source, truncated })),
        },
      })
    } finally {
      set({ updating: false })
      await get().check()
    }
  },
}))

export default useAppUpdatesStore
