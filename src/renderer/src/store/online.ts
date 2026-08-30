import { create } from "zustand"

interface OnlineState {
  online: boolean
  setOnline: (online: boolean) => void
  checkOnline: () => Promise<void>
}

const CHECK_ENDPOINTS = [
  "https://1.1.1.1/cdn-cgi/trace",
  "https://cloudflare.com/cdn-cgi/trace",
  "https://www.google.com/generate_204",
]

const useOnlineStore = create<OnlineState>((set) => ({
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  setOnline: (online: boolean) => set({ online }),
  checkOnline: async () => {
    if (typeof navigator === "undefined") return

    if (!navigator.onLine) {
      set({ online: false })
      return
    }

    for (const endpoint of CHECK_ENDPOINTS) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const res = await fetch(endpoint, {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-cache",
          mode: "no-cors",
        })
        clearTimeout(timeout)
        if (res.type === "opaque" || res.ok) {
          set({ online: true })
          return
        }
      } catch {
        continue
      }
    }
    set({ online: false })
  },
}))

if (typeof window !== "undefined") {
  window.addEventListener("online", () => useOnlineStore.getState().setOnline(true))
  window.addEventListener("offline", () => useOnlineStore.getState().setOnline(false))
}

export default useOnlineStore
