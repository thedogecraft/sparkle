import { Loader2, Menu, Minus, Square, X } from "lucide-react"
import { close, minimize, toggleMaximize } from "../lib/electron"
import sparkleLogo from "../../../../resources/sparklelogo.png"
import Card from "./ui/Card"
import useAppInstallStore from "@/store/appInstallStore"
import { useTranslation } from "react-i18next"

interface TitleBarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

function TitleBar({
  onToggleSidebar,
  sidebarCollapsed: _sidebarCollapsed,
}: TitleBarProps): React.ReactElement {
  const { t } = useTranslation()
  const { apps, action } = useAppInstallStore()
  const actionText = action === "uninstall" ? t("titlebar.uninstalling") : t("titlebar.installing")

  const currentApp = apps.find((app) => app.status === "installing")
  const remainingCount = apps.filter((app) => app.status === "pending").length

  return (
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
          {t("titlebar.beta")}
        </div>
      </div>
      <div>
        {apps.length > 0 && (
          <Card
            key="install-status"
            className="p-2 text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300 fill-mode-both"
          >
            <Loader2 className="animate-spin text-xs w-4 h-4" />
            {apps.length === 1
              ? `${actionText} ${apps[0].name}`
              : currentApp
                ? `${actionText} ${currentApp.name}, ${remainingCount} ${t("titlebar.left")}`
                : `${actionText} ${apps.length} apps`}
          </Card>
        )}
      </div>
      <div className="flex" style={{ WebkitAppRegion: "no-drag" } as any}>
        <button
          onClick={minimize}
          className="h-[50px] w-12 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={toggleMaximize}
          className="h-[50px] w-12 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors"
        >
          <Square size={14} />
        </button>
        <button
          onClick={close}
          className="h-[50px] w-12 inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-red-600 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
