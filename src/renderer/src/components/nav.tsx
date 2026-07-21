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
  RotateCw,
  Settings,
  Wrench,
  WifiOff,
  Bubbles,
  Power,
  Moon,
  Lock,
  ArrowUpCircle,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import info from "../../../../package.json"
import useRestartStore from "../store/restartState"
import DiscordIcon from "./discordicon"
import GithubIcon from "./githubicon"
import Button from "./ui/button"
import Modal from "./ui/modal"
import useOnlineStore from "../store/online"
import useAppUpdatesStore from "../store/appUpdatesStore"

const tabIcons = {
  home: <Home size={20} />,
  tweaks: <Wrench size={20} />,
  debloat: <Bubbles size={20} />,
  clean: <Icon iconNode={broom} size={20} />,
  backup: <Folder size={20} />,
  utilities: <Box size={20} />,
  dns: <EthernetPort size={20} />,
  apps: <LayoutGrid size={20} />,
  appUpdates: <ArrowUpCircle size={20} />,
  settings: <Settings size={20} />,
}

const tabs = {
  home: { label: "Dashboard", path: "/" },
  tweaks: { label: "Tweaks", path: "/tweaks" },
  debloat: { label: "Debloat+", path: "/debloat" },
  utilities: { label: "Utilities", path: "/utilities" },
  clean: { label: "Cleaner", path: "/clean" },
  backup: { label: "Restore", path: "/backup" },
  dns: { label: "DNS Manager", path: "/dns" },
  apps: { label: "Apps", path: "/apps" },
  appUpdates: { label: "App Updates", path: "/app-updates" },
  settings: { label: "Settings", path: "/settings" },
}

type PowerAction = {
  id: string
  label: string
  channel: string
  icon: React.ReactNode
  confirm?: string
}

function Nav({ collapsed }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { needsRestart } = useRestartStore()

  const tabRefs = useRef<Record<string, HTMLElement | null>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 })
  const [showRestartModal, setShowRestartModal] = useState(false)
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [powerMenuOpen, setPowerMenuOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState(false)
  const [confirmAction, setConfirmAction] = useState<PowerAction | null>(null)
  const powerMenuRef = useRef<HTMLDivElement | null>(null)
  const [hasShownOfflineModal, setHasShownOfflineModal] = useState(false)
  const { online, checkOnline } = useOnlineStore()
  const updateCount = useAppUpdatesStore((s) => s.updates.length)

  const disabledTabs = ["dns", "apps", "appUpdates"]

  useEffect(() => {
    checkOnline()
    const interval = setInterval(checkOnline, 5000)
    return () => clearInterval(interval)
  }, [checkOnline])

  useEffect(() => {
    if (!online && !hasShownOfflineModal) {
      setShowOfflineModal(true)
      setHasShownOfflineModal(true)
    } else if (online) {
      setHasShownOfflineModal(false)
    }
  }, [online, hasShownOfflineModal])

  const getActiveTab = () => {
    const path = location.pathname
    if (path === "/") return "home"
    const match = Object.entries(tabs).find(([, { path: p }]) => p === path)
    return match ? match[0] : ""
  }

  const activeTab = getActiveTab()

  useEffect(() => {
    const updateIndicator = () => {
      const ref = tabRefs.current[activeTab]
      const container = containerRef.current
      if (ref && ref instanceof HTMLElement && container) {
        const tabRect = ref.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        setIndicatorStyle({
          top: tabRect.top - containerRect.top,
          height: tabRect.height,
        })
      }
    }
    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [activeTab])

  // Re-check on every open so the update options can't go stale.
  useEffect(() => {
    if (!powerMenuOpen) return
    invoke({ channel: "get-pending-update" })
      .then((result) => setPendingUpdate(!!result?.pending))
      .catch(() => setPendingUpdate(false))
  }, [powerMenuOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (powerMenuRef.current && !powerMenuRef.current.contains(event.target as Node)) {
        setPowerMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const powerActions: PowerAction[] = [
    { id: "sleep", label: "Sleep", channel: "sleep", icon: <Moon size={16} /> },
    { id: "lock", label: "Lock", channel: "lock", icon: <Lock size={16} /> },
    ...(pendingUpdate
      ? [
          {
            id: "update-restart",
            label: "Update and restart",
            channel: "update-and-restart",
            icon: <RotateCw size={16} />,
            confirm: "Windows will install pending updates and then restart. Continue?",
          },
          {
            id: "update-shutdown",
            label: "Update and shut down",
            channel: "update-and-shutdown",
            icon: <Power size={16} />,
            confirm: "Windows will install pending updates and then shut down. Continue?",
          },
        ]
      : []),
    {
      id: "restart",
      label: "Restart",
      channel: "restart",
      icon: <RotateCw size={16} />,
      confirm: "Are you sure you want to restart your computer now?",
    },
    {
      id: "shutdown",
      label: "Shut Down",
      channel: "shutdown",
      icon: <Power size={16} />,
      confirm: "Are you sure you want to shut down your computer now?",
    },
  ]

  return (
    <nav
      className={`h-screen text-sparkle-text fixed left-0 top-0 flex flex-col py-6 z-40  transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-52"}`}
    >
      <div className="flex-1 flex flex-col gap-2 px-3 mt-10 relative" ref={containerRef}>
        <div
          className="absolute left-0 w-1 bg-sparkle-primary rounded-sm transition-all duration-300"
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            transition: "top 0.2s ease, height 0.2s ease",
          }}
        />
        {Object.entries(tabs).map(([id, { label, path }]) => {
          const isDisabled = !online && disabledTabs.includes(id)
          return (
            <Button
              variant=""
              key={id}
              ref={(el) => (tabRefs.current[id] = el)}
              onClick={() => {
                if (isDisabled) {
                  setShowOfflineModal(true)
                } else {
                  navigate(path)
                }
              }}
              disabled={isDisabled}
              className={clsx(
                `flex items-center gap-3 py-2 rounded-lg transition-all duration-200 border relative ${collapsed ? "px-2 justify-center" : "px-3"}`,
                activeTab === id
                  ? "border-transparent text-sparkle-primary"
                  : isDisabled
                    ? "opacity-50 cursor-not-allowed text-sparkle-text-secondary border-transparent"
                    : "text-sparkle-text-secondary hover:bg-sparkle-border-secondary hover:text-sparkle-text border-transparent",
              )}
            >
              <div>{tabIcons[id]}</div>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">{label}</span>
                  {id === "debloat" && (
                    <span className="rounded-full bg-sparkle-primary/10 text-sparkle-primary text-[10px] uppercase tracking-[0.08em] px-2 py-0.5">
                      Beta
                    </span>
                  )}
                  {id === "appUpdates" && updateCount > 0 && (
                    <span className="rounded-full bg-sparkle-primary/10 text-sparkle-primary text-[10px] tracking-[0.08em] px-2 py-0.5">
                      {updateCount}
                    </span>
                  )}
                </div>
              )}
            </Button>
          )
        })}
      </div>
      {needsRestart && (
        <button
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 border m-3",
            "bg-sparkle-card text-sparkle-text border-sparkle-border-secondary hover:bg-sparkle-border-secondary hover:text-sparkle-text",
          )}
          onClick={() => setShowRestartModal(true)}
        >
          <span
            className={`flex text-center items-center gap-2 text-red-500 ${collapsed ? "justify-center" : ""}`}
            title="Restart Windows to apply some changes"
          >
            <RotateCw size={16} /> {!collapsed && "Restart Required"}
          </span>
        </button>
      )}
      <Modal open={showRestartModal} onOpenChange={setShowRestartModal}>
        <div className="bg-sparkle-card p-4 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
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
      <Modal open={showOfflineModal} onOpenChange={setShowOfflineModal}>
        <div className="bg-sparkle-card p-4 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-full">
              <WifiOff className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold">You're Offline</h2>
          </div>
          <p className="text-sparkle-text-secondary mb-4">
            Some features require an internet connection to work. The following features have been
            disabled:
          </p>
          <ul className="list-disc list-inside text-sparkle-text-secondary mb-4 space-y-1">
            <li>
              <span className="font-medium text-sparkle-text">DNS Manager</span> - Requires internet
              to change DNS servers
            </li>
            <li>
              <span className="font-medium text-sparkle-text">Apps</span> - Requires internet to
              install/uninstall apps
            </li>
            <li>
              <span className="font-medium text-sparkle-text">Some Tweaks</span> - May fail without
              internet
            </li>
            <li>
              <span className="font-medium text-sparkle-text">Auto Updates</span> - Will fail
              without internet
            </li>
          </ul>
          <p className="text-sm text-sparkle-text-secondary mb-4">
            Please reconnect to the internet to use these features.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setShowOfflineModal(false)} variant="secondary">
              Understood
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <div className="bg-sparkle-card p-4 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
          <h2 className="text-lg font-semibold">Confirm {confirmAction?.label}</h2>
          <p>{confirmAction?.confirm}</p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setConfirmAction(null)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                const channel = confirmAction?.channel
                setConfirmAction(null)
                if (channel) invoke({ channel })
              }}
              variant="danger"
            >
              {confirmAction?.label}
            </Button>
          </div>
        </div>
      </Modal>
      <div className="relative mx-3" ref={powerMenuRef}>
        <div
          className={clsx(
            "absolute bottom-full mb-2 bg-sparkle-card border border-sparkle-border rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-200 origin-bottom",
            collapsed ? "left-0 w-40" : "left-0 right-0",
            powerMenuOpen
              ? "opacity-100 scale-y-100"
              : "opacity-0 scale-y-0 pointer-events-none",
          )}
        >
          {powerActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                setPowerMenuOpen(false)
                if (action.confirm) {
                  setConfirmAction(action)
                } else {
                  invoke({ channel: action.channel })
                }
              }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-sparkle-text hover:bg-sparkle-border-secondary transition-colors"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <button
          className={clsx(
            "w-full flex items-center rounded-lg transition-all duration-200 border py-2",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
            "bg-sparkle-card text-sparkle-text-secondary border-sparkle-border-secondary hover:bg-sparkle-border-secondary hover:text-sparkle-text",
          )}
          onClick={() => setPowerMenuOpen((open) => !open)}
          title="Power options"
        >
          <Power size={16} />
          {!collapsed && <span className="text-sm">Power</span>}
        </button>
      </div>
      <div
        className={`flex items-center justify-center gap-2 mt-4 mb-2 ${collapsed ? "flex-col" : ""}`}
      >
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
