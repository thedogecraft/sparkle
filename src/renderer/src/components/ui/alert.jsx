import React from "react"
import { AlertCircle, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Alert({
  type = "info",
  title = "",
  message = "",
  children = null,
  actions = [],
  closeable = false,
  onClose = null,
  className = "",
}) {
  const [closed, setClosed] = React.useState(false)

  const handleClose = () => {
    setClosed(true)
    onClose?.()
  }

  if (closed) return null

  const typeConfig = {
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      icon: <Info className="w-5 h-5 text-blue-500" />,
      textColor: "text-blue-100",
      titleColor: "text-blue-200",
    },
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      textColor: "text-yellow-100",
      titleColor: "text-yellow-200",
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      textColor: "text-red-100",
      titleColor: "text-red-200",
    },
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      textColor: "text-green-100",
      titleColor: "text-green-200",
    },
    critical: {
      bg: "bg-red-500/20",
      border: "border-red-600/50",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      textColor: "text-red-100",
      titleColor: "text-red-100 font-semibold",
    },
  }

  const config = typeConfig[type] || typeConfig.info

  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex gap-4",
        config.bg,
        config.border,
        className,
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>

      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={cn("font-semibold mb-1", config.titleColor)}>
            {title}
          </h3>
        )}

        <div className={cn("text-sm leading-relaxed", config.textColor)}>
          {children || message}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={cn(
                  "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                  action.variant === "primary"
                    ? "bg-sparkle-primary hover:bg-sparkle-primary/90 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white",
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {closeable && (
        <button
          onClick={handleClose}
          className={cn(
            "flex-shrink-0 text-sm font-semibold hover:opacity-80 transition-opacity",
            config.textColor,
          )}
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function PermissionAlert({
  tweakName = "",
  riskLevel = "medium",
  isReversible = true,
  requiresRestart = false,
  affectedAreas = [],
  onConfirm = null,
  onCancel = null,
}) {
  const riskConfig = {
    critical: {
      title: "⚠️ Critical System Changes",
      color: "critical",
    },
    high: {
      title: "⚠️ Important System Changes",
      color: "warning",
    },
    medium: {
      title: "🔒 Administrator Access Required",
      color: "info",
    },
    low: {
      title: "ℹ️ This action requires administrator permissions",
      color: "info",
    },
  }

  const config = riskConfig[riskLevel] || riskConfig.medium

  const actions = []
  if (onCancel) {
    actions.push({
      label: "Cancel",
      onClick: onCancel,
      variant: "secondary",
    })
  }
  if (onConfirm) {
    actions.push({
      label: "Proceed",
      onClick: onConfirm,
      variant: "primary",
    })
  }

  return (
    <Alert
      type={config.color}
      title={config.title}
      actions={actions}
    >
      <div className="space-y-2">
        {tweakName && (
          <p className="font-medium">
            Applying: <span className="text-sparkle-primary">{tweakName}</span>
          </p>
        )}

        <div className="space-y-1 text-sm">
          {!isReversible && (
            <p className="flex items-center gap-2">
              <span className="text-red-400">❌</span>
              This change <span className="font-semibold">cannot be automatically reverted</span>
            </p>
          )}

          {isReversible && (
            <p className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              This change can be reverted if needed
            </p>
          )}

          {requiresRestart && (
            <p className="flex items-center gap-2">
              <span className="text-yellow-400">🔄</span>
              A system restart may be required
            </p>
          )}

          {affectedAreas && affectedAreas.length > 0 && (
            <p>
              <span className="font-semibold">Affected Areas:</span> {affectedAreas.join(", ")}
            </p>
          )}
        </div>

        <p className="text-xs opacity-75 pt-1">
          Please ensure you have a backup before proceeding.
        </p>
      </div>
    </Alert>
  )
}

export function WarningAlert({ message, title = "Warning" }) {
  return (
    <Alert
      type="warning"
      title={title}
      message={message}
      closeable
    />
  )
}

export function ErrorAlert({ message, title = "Error", onClose = null }) {
  return (
    <Alert
      type="error"
      title={title}
      message={message}
      closeable
      onClose={onClose}
    />
  )
}

export function InfoAlert({ message, title = "Information" }) {
  return (
    <Alert
      type="info"
      title={title}
      message={message}
      closeable
    />
  )
}
