import { useState, useCallback } from "react"
import { invoke } from "@/lib/electron"
import log from "electron-log/renderer"

export function usePermissions() {
  const [permissions, setPermissions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getTweakPermissions = useCallback(async (tweak) => {
    try {
      setLoading(true)
      setError(null)

      const perms = await invoke("permission:getTweakRequirements", tweak)
      setPermissions(perms)

      log.debug("usePermissions", `Permissions retrieved for ${tweak.title}`, perms)

      return perms
    } catch (err) {
      const errorMsg = err.message || "Failed to retrieve permissions"
      setError(errorMsg)
      log.error("usePermissions", "Failed to get permissions", err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getWarningMessage = useCallback(async (perms) => {
    try {
      const message = await invoke("permission:getWarningMessage", perms)
      return message
    } catch (err) {
      log.error("usePermissions", "Failed to get warning message", err)
      return "Administrator access required to complete this action."
    }
  }, [])

  const checkAdminRequired = useCallback(async (operationType) => {
    try {
      const requires = await invoke("permission:requiresAdmin", operationType)
      return requires
    } catch (err) {
      log.error("usePermissions", "Failed to check admin requirement", err)
      return true
    }
  }, [])

  const logPermissionRequest = useCallback(async (component, reason, granted, metadata = {}) => {
    try {
      await invoke("permission:logRequest", {
        component,
        reason,
        granted,
        metadata,
      })
    } catch (err) {
      log.warn("usePermissions", "Failed to log permission request", err)
    }
  }, [])

  const requestTweakPermission = useCallback(
    async (tweak) => {
      try {
        const perms = await getTweakPermissions(tweak)
        if (!perms) return false

        await logPermissionRequest(
          "Renderer",
          `Tweak: ${tweak.title}`,
          true,
          {
            riskLevel: perms.riskLevel,
            isReversible: perms.isReversible,
          },
        )

        return perms
      } catch (err) {
        log.error("usePermissions", "Failed to request tweak permission", err)
        return false
      }
    },
    [getTweakPermissions, logPermissionRequest],
  )

  const reset = useCallback(() => {
    setPermissions(null)
    setError(null)
  }, [])

  return {
    permissions,
    loading,
    error,
    getTweakPermissions,
    getWarningMessage,
    checkAdminRequired,
    logPermissionRequest,
    requestTweakPermission,
    reset,
  }
}

export default usePermissions
