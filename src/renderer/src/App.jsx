import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import TitleBar from "./components/titlebar"
import Nav from "./components/nav"
import "./app.css"
import { ToastContainer, Slide } from "react-toastify"
import Home from "./pages/Home"
import Tweaks from "./pages/Tweaks"
import Clean from "./pages/Clean"
import Apps from "./pages/Apps"
import Utilities from "./pages/Utilities"
import DNS from "./pages/DNS"
import Settings from "./pages/Settings"
import Backup from "./pages/Backup"
import FirstTime from "./components/firsttime"
import UpdateManager from "./components/updatemanager"

import useSidebarStore from "@/store/sidebarStore"
import { clsx } from "clsx"

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system")
  const { isCollapsed } = useSidebarStore()

  useEffect(() => {
    const applyTheme = (theme) => {
      document.body.classList.remove("light", "purple", "dark", "gray", "classic")
      if (theme === "system" || !theme) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        document.body.classList.add(systemTheme)
        document.body.setAttribute("data-theme", systemTheme)
      } else {
        document.body.classList.add(theme)
        document.body.setAttribute("data-theme", theme)
      }
    }

    applyTheme(theme)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
      if ((localStorage.getItem("theme") || "system") === "system") applyTheme("system")
    }

    const handleStorageChange = (e) => {
      if (e.key === "theme") setTheme(e.newValue || "system")
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)
    window.addEventListener("storage", handleStorageChange)

    if (localStorage.getItem("posthogDisabled") === "true") {
      document.body.classList.add("ph-no-capture")
    } else {
      document.body.classList.remove("ph-no-capture")
    }

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [theme])

  return (
    <div className="flex flex-col h-screen bg-sparkle-bg text-sparkle-text overflow-hidden">
      <FirstTime />
      <TitleBar />
      <Nav />
      <div className="flex flex-1 pt-8 relative">
        <main
          className={clsx(
            "flex-1 p-6 rounded-tl-2xl border-t border-l border-sparkle-border transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
            isCollapsed ? "ml-14" : "ml-60",
          )}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tweaks" element={<Tweaks />} />
            <Route path="/clean" element={<Clean />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/utilities" element={<Utilities />} />
            <Route path="/dns" element={<DNS />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <UpdateManager />
      <ToastContainer
        stacked
        limit={5}
        position="bottom-right"
        theme="dark"
        transition={Slide}
        hideProgressBar
        pauseOnFocusLoss={false}
      />
    </div>
  )
}

export default App
