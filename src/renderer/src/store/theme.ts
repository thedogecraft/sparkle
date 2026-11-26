import { create } from "zustand"

export type Theme = "system" | "dark" | "light" | "purple" | "gray" | "classic"

export const THEME_STORAGE_KEY = "theme"

const THEME_CLASSES = ["light", "purple", "dark", "gray", "classic"] as const

const isTheme = (value: string | null): value is Theme =>
  value === "system" ||
  value === "dark" ||
  value === "light" ||
  value === "purple" ||
  value === "gray" ||
  value === "classic"

const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : "system"
}

export const resolveTheme = (theme: Theme): "dark" | "light" => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme === "light" ? "light" : "dark"
}

export const applyTheme = (theme: Theme): void => {
  const active = theme === "system" ? (resolveTheme(theme) === "dark" ? "dark" : "light") : theme
  document.body.classList.remove(...THEME_CLASSES)
  document.body.classList.add(active)
  document.body.setAttribute("data-theme", active)
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleLightDark: () => "dark" | "light"
}

const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getStoredTheme(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
  toggleLightDark: () => {
    const next = resolveTheme(get().theme) === "dark" ? "light" : "dark"
    get().setTheme(next)
    return next
  },
}))

if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  mediaQuery.addEventListener("change", () => {
    if (useThemeStore.getState().theme === "system") applyTheme("system")
  })

  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_STORAGE_KEY) return
    const theme = getStoredTheme()
    useThemeStore.setState({ theme })
    applyTheme(theme)
  })
}

export default useThemeStore
