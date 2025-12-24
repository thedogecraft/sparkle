import { Minus, Square, X } from "lucide-react"
import { close, minimize, toggleMaximize } from "../lib/electron"
import sparkleLogo from "../../../../resources/sparklelogo.png"

/**
 * Renders the application's compact, draggable native-style title bar with window controls.
 *
 * Displays a fixed top bar that is draggable across most of its area and contains a non-draggable control group with minimize, maximize/restore, and close buttons. Buttons trigger the window minimize, maximize/restore, and close actions.
 * @returns {JSX.Element} The title bar element.
 */
function TitleBar() {
  return (
    <div
      style={{ WebkitAppRegion: "drag" }}
      className="h-8 fixed top-0 left-0 right-0 flex justify-between items-center pl-3 bg-transparent z-50 text-xs"
    >
      <div className="flex items-center gap-3 h-full pr-4">
        {/* Logo moved to Sidebar */}
      </div>

      <div className="flex" style={{ WebkitAppRegion: "no-drag" }}>
        <button
          onClick={minimize}
          className="h-8 w-[46px] inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={toggleMaximize}
          className="h-8 w-[46px] inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-sparkle-accent transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={close}
          className="h-8 w-[46px] inline-flex items-center justify-center text-sparkle-text-secondary hover:bg-red-600 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar