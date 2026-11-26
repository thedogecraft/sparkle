import { useEffect, useRef } from "react"
import { toast } from "react-toastify"
import { invoke } from "@/lib/electron"
import useThemeStore, { type Theme } from "@/store/theme"

interface CaptureResult {
  filePath: string
  directory: string
}

const CAPTURE_THEMES: Theme[] = ["light", "dark"]

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimeout(resolve, 350))
    })
  })

const getPageName = () => window.location.hash.replace(/^#\/?/, "").split("?")[0] || "home"

export function useThemeScreenshotShortcuts() {
  const busy = useRef(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.code !== "KeyD" && event.code !== "KeyS") return

      event.preventDefault()
      if (busy.current) return

      if (event.code === "KeyD") {
        useThemeStore.getState().toggleLightDark()
        return
      }

      busy.current = true

      void (async () => {
        const previousTheme = useThemeStore.getState().theme
        const page = getPageName()
        let directory = ""

        try {
          for (const theme of CAPTURE_THEMES) {
            useThemeStore.getState().setTheme(theme)
            await waitForPaint()

            const result = (await invoke({
              channel: "screenshot:capture",
              payload: { page, theme },
            })) as CaptureResult
            directory = result.directory
          }

          toast.success(`Saved light and dark screenshots to ${directory}`, { autoClose: 4000 })
        } catch (error) {
          toast.error(`Could not capture screenshots: ${String(error)}`)
        } finally {
          useThemeStore.getState().setTheme(previousTheme)
          await waitForPaint()
          busy.current = false
        }
      })()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}
