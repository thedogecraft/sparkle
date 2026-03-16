import { Menu, Minus, Square, X } from "lucide-react"
import { close, minimize, toggleMaximize } from "../lib/electron"
import sparkleLogo from "../../../../resources/sparklelogo.png"

interface TitleBarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

function TitleBar({
  onToggleSidebar,
  sidebarCollapsed: _sidebarCollapsed,
}: TitleBarProps): React.ReactElement {
  return (
    <div
      style={{ WebkitAppRegion: "drag" } as any}
      className="h-12.5 fixed top-0 left-0 right-0 flex justify-between items-center pl-4 bg-sparkle-bg z-50"
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
