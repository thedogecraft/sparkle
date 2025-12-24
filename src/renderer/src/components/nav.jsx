import { invoke } from "@/lib/electron"
import { broom } from "@lucide/lab"
import { clsx } from "clsx"
import {
  Box,
  EthernetPort,
  Folder,
  Home,
  Icon,
  LayoutGrid,
  RefreshCw,
  Settings,
  Wrench,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import info from "../../../../package.json"
import useRestartStore from "../store/restartState"
import DiscordIcon from "./discordicon"
import GithubIcon from "./githubicon"
import Button from "./ui/button"
import Modal from "./ui/modal"

import useSidebarStore from "../store/sidebarStore"
import { ChevronLeft, ChevronRight } from "lucide-react"

import sparkleLogo from "../../../../resources/sparklelogo.png"

const tabIcons = {
  home: <Home size={20} />,
  tweaks: <Wrench size={20} />,
  clean: <Icon iconNode={broom} size={20} />,
  backup: <Folder size={20} />,
  utilities: <Box size={20} />,
  dns: <EthernetPort size={20} />,
  apps: <LayoutGrid size={20} />,
  settings: <Settings size={20} />,
}

const tabs = {
  home: { label: "Dashboard", path: "/" },
  tweaks: { label: "Tweaks", path: "/tweaks" },
  utilities: { label: "Utilities", path: "/utilities" },
  clean: { label: "Cleaner", path: "/clean" },
  backup: { label: "Restore Points", path: "/backup" },
  dns: { label: "DNS Manager", path: "/dns" },
  apps: { label: "Apps", path: "/apps" },
  settings: { label: "Settings", path: "/settings" },
}

function Nav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { needsRestart } = useRestartStore()

  const tabRefs = useRef({})
  const containerRef = useRef(null)
  const [showRestartModal, setShowRestartModal] = useState(false)

  const { isCollapsed, toggle } = useSidebarStore()

  const getActiveTab = () => {
    const path = location.pathname
    if (path === "/") return "home"
    const match = Object.entries(tabs).find(([, { path: p }]) => p === path)
    return match ? match[0] : ""
  }

  const activeTab = getActiveTab()

  return (
    <nav
      className={clsx(
        "h-screen text-sparkle-text fixed left-0 top-0 flex flex-col pt-4 pb-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] group",
        isCollapsed ? "w-14" : "w-60",
      )}
    >
      <button
        onClick={toggle}
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-sparkle-card border border-sparkle-border rounded-full flex items-center justify-center text-sparkle-text shadow-md hover:bg-sparkle-border transition-all duration-300 z-50 focus:outline-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      <div className={clsx("mb-6 flex items-center transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] pl-3", isCollapsed ? "gap-0" : "gap-3")}>
        <img src={sparkleLogo} alt="Sparkle" className="h-8 w-8 shrink-0" />
        <div className={clsx("overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]", isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100")}>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-xl font-bold bg-linear-to-r from-white to-white/80 bg-clip-text text-transparent">
              Sparkle
            </span>
            <div className="bg-sparkle-primary/10 text-sparkle-primary border border-sparkle-primary/20 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
              Beta
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2 relative px-2" ref={containerRef}>
        {Object.entries(tabs).map(([id, { label, path }]) => (
          <Button
            variant=""
            key={id}
            ref={(el) => (tabRefs.current[id] = el)}
            onClick={() => navigate(path)}
            className={clsx(
              "flex items-center py-2.5 rounded-2xl transition-all duration-200 border-none relative font-medium overflow-hidden pl-2.5 w-full",
              isCollapsed ? "gap-0" : "gap-3",
              activeTab === id
                ? clsx("text-sparkle-primary", !isCollapsed && "bg-sparkle-primary/15")
                : "text-sparkle-text-secondary hover:text-sparkle-text",
            )}
            title={isCollapsed ? label : ""}
          >
            <div className="shrink-0">{tabIcons[id]}</div>
            <span className={clsx("text-sm transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.2,0,0,1)] whitespace-nowrap overflow-hidden delay-100", isCollapsed ? "max-w-0 opacity-0 delay-0" : "max-w-[150px] opacity-100")}>{label}</span>
            {id === "utilities" && !isCollapsed && (
              <span className="text-xs bg-sparkle-primary text-sparkle-bg px-1.5 py-0.5 rounded-full ml-auto">
                New
              </span>
            )}
            {id === "utilities" && isCollapsed && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-sparkle-primary rounded-full" />
            )}
          </Button>
        ))}
      </div>
      {needsRestart && (
        <button
          className={clsx(
            "flex items-center py-2 rounded-lg transition-all duration-200 border mx-2 mb-3 mt-auto overflow-hidden whitespace-nowrap pl-2.5",
            isCollapsed ? "gap-0" : "gap-3",
            "bg-sparkle-card text-sparkle-text border-sparkle-border-secondary hover:bg-sparkle-border-secondary hover:text-sparkle-text",
          )}
          onClick={() => setShowRestartModal(true)}
          title="Restart Windows"
        >
          <span
            className={clsx("flex text-center items-center text-red-500", isCollapsed ? "gap-0" : "gap-2")}
          >
            <RefreshCw size={16} className="shrink-0" />
            <span className={clsx("transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.2,0,0,1)] overflow-hidden whitespace-nowrap", isCollapsed ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100")}>Restart Now</span>
          </span>
        </button>
      )}
      <Modal open={showRestartModal} onOpenChange={setShowRestartModal}>
        <div className="bg-sparkle-card p-6 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
          <h2 className="text-lg font-semibold">Confirm Restart</h2>
          <p>Are you sure you want to restart your computer now?</p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowRestartModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowRestartModal(false)
                invoke({ channel: "restart" })
              }}
              variant="danger"
            >
              Restart
            </Button>
          </div>
        </div>
      </Modal>
      <div className={clsx("flex items-center justify-center gap-4 mt-4 mb-2", isCollapsed ? "flex-col" : "flex-row")}>
        <a href="https://github.com/parcoil/sparkle" target="_blank">
          <GithubIcon className="w-5 fill-sparkle-primary" />
        </a>
        <a href="https://discord.com/invite/En5YJYWj3Z" target="_blank">
          <DiscordIcon className="w-5 fill-sparkle-primary" />
        </a>
      </div>
      <p className="text-sparkle-primary text-center text-sm">v{info.version}</p>
    </nav>
  )
}

export default Nav
