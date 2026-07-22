import { useState } from "react"
import { Loader2, Menu, Minus, Shield, Square, Terminal, X } from "lucide-react"
import { close, minimize, toggleMaximize } from "../lib/electron"
import sparkleLogo from "../../../../resources/sparklelogo.png"
import Card from "./ui/Card"
import useAppInstallStore from "@/store/appInstallStore"
import InstallConsoleModal from "./installConsoleModal"

interface TitleBarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  adminStatus: boolean | null
}

function TitleBar({
  onToggleSidebar,
  sidebarCollapsed: _sidebarCollapsed,
  adminStatus,
}: TitleBarProps): React.ReactElement {
  const { apps, action } = useAppInstallStore()
  const [consoleOpen, setConsoleOpen] = useState(false)
  const actionText = action === "uninstall" ? "Uninstalling" : "Installing"

  const currentApp = apps.find((app) => app.status === "installing")
  const remainingCount = apps.filter((app) => app.status === "pending").length

  return (
    <>
      <InstallConsoleModal open={consoleOpen} onClose={() => setConsoleOpen(false)} />
      <div
        style={{ WebkitAppRegion: "drag" } as any}
        className="h-[50px] fixed top-0 left-0 right-0 flex justify-between items-center pl-4 bg-sparkle-bg z-50"
      >
        <div className="flex items-center gap-3 h-full pr-4">
          <button
            onClick={onToggleSidebar}
            className="h-7 w-7 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors rounded"
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            <Menu size={16} />
          </button>
          <img src={sparkleLogo} alt="Sparkle" className="h-5 w-5" />
          <span className="text-sparkle-text text-sm font-medium">Sparkle</span>
          <div className="bg-sparkle-card border border-sparkle-border-secondary p-1 rounded-xl w-16 text-center text-sm text-sparkle-text">
            Beta
          </div>
        </div>
        <div>
          {apps.length > 0 && (
            <Card
              key="install-status"
              className="p-2 text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300 fill-mode-both cursor-pointer hover:bg-sparkle-accent transition-colors"
              onClick={() => setConsoleOpen(true)}
              style={{ WebkitAppRegion: "no-drag" } as any}
            >
              <Loader2 className="animate-spin text-xs w-4 h-4" />
              {apps.length === 1
                ? `${actionText} ${apps[0].name}`
                : currentApp
                  ? `${actionText} ${currentApp.name}, ${remainingCount} Left`
                  : `${actionText} ${apps.length} apps`}
              <Terminal className="w-3 h-3 text-sparkle-primary" />
            </Card>
          )}
        </div>

        <div className="flex" style={{ WebkitAppRegion: "no-drag" } as any}>
          <div
            className="h-12.5 w-12 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors"
            title={adminStatus ? "Running as Administrator" : "Not running as Administrator"}
          >
            {adminStatus ? (
              <Shield className="w-5 h-5 text-sparkle-primary" />
            ) : (
              <Shield className="w-5 h-5 text-red-600" />
            )}
          </div>
          <button
            onClick={minimize}
            className="h-12.5 w-12 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={toggleMaximize}
            className="h-12.5 w-12 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors"
          >
            <Square size={14} />
          </button>
          <button
            onClick={close}
            className="h-12.5 w-12 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-red-600 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

export default TitleBar
