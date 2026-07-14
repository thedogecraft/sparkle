import { useEffect, useRef } from "react"
import Modal from "./ui/modal"
import useAppInstallStore from "@/store/appInstallStore"
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react"
import Button from "./ui/button"

interface InstallConsoleModalProps {
  open: boolean
  onClose: () => void
}

function InstallConsoleModal({ open, onClose }: InstallConsoleModalProps) {
  const { apps, action } = useAppInstallStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalLogs = apps.reduce((sum, app) => sum + app.logs.length, 0)

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [totalLogs])

  useEffect(() => {
    if (apps.length > 0 && apps.every((app) => app.status === "complete" || app.status === "error")) {
      setTimeout(onClose, 1500)
    }
  }, [apps, onClose])

  const actionText = action === "uninstall" ? "Uninstalling" : "Installing"

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-sparkle-text flex items-center gap-2">
            <Loader2 className="animate-spin text-sparkle-primary w-5 h-5" />
            {actionText} {apps.length === 1 ? apps[0]?.name : `${apps.length} apps`}
          </h3>
          <button
            onClick={onClose}
            className="text-sparkle-text-muted hover:text-sparkle-text transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          ref={scrollRef}
          className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-4 mb-4"
        >
          {apps.map((app) => (
            <div key={app.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-sparkle-text">{app.name}</span>
                {app.status === "installing" && (
                  <Loader2 className="animate-spin text-sparkle-primary w-3 h-3" />
                )}
                {app.status === "complete" && (
                  <CheckCircle2 className="text-green-500 w-3 h-3" />
                )}
                {app.status === "error" && (
                  <XCircle className="text-red-500 w-3 h-3" />
                )}
              </div>
              <div className="bg-sparkle-accent rounded-lg p-3 font-mono text-xs text-sparkle-text-secondary whitespace-pre-wrap break-all">
                {app.logs.length > 0 ? (
                  app.logs.map((line, i) => (
                    <div key={i} className="leading-relaxed">
                      <span className="text-sparkle-text-muted select-none mr-2">$</span>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-sparkle-text-muted italic">Waiting for output...</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default InstallConsoleModal
