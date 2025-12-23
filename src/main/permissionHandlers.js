import { ipcMain } from "electron"
import PermissionManager from "./permissionManager.js"
import { logger } from "./logger.js"

export function setupPermissionHandlers() {
  ipcMain.handle("permission:getTweakRequirements", async (event, tweakMetadata) => {
    try {
      const permissions = PermissionManager.getTweakPermissions(tweakMetadata)
      logger.debug(
        "PermissionHandler",
        `Permission requirements requested for tweak: ${tweakMetadata.title}`,
        {
          tweakName: tweakMetadata.title,
          ...permissions,
        },
      )
      return permissions
    } catch (error) {
      logger.error("PermissionHandler", "Failed to get permission requirements", {
        error: error.message,
        tweakName: tweakMetadata.title,
      })
      return {
        requiresAdmin: true,
        riskLevel: "high",
        affectedAreas: ["System"],
        isReversible: tweakMetadata.reversible !== false,
        requiresRestart: false,
      }
    }
  })

  ipcMain.handle("permission:getWarningMessage", async (event, permissions) => {
    try {
      const message = PermissionManager.getPermissionWarningMessage(permissions)
      return message
    } catch (error) {
      logger.error("PermissionHandler", "Failed to generate warning message", {
        error: error.message,
      })
      return "Administrator access required to complete this action."
    }
  })

  ipcMain.handle("permission:requiresAdmin", async (event, operationType) => {
    try {
      const requires = PermissionManager.requiresAdminElevation(operationType)
      logger.debug("PermissionHandler", `Admin requirement check for ${operationType}`, {
        operationType,
        requiresAdmin: requires,
      })
      return requires
    } catch (error) {
      logger.error("PermissionHandler", "Failed to check admin requirement", {
        error: error.message,
        operationType,
      })
      return true
    }
  })

  ipcMain.handle("permission:logRequest", async (event, logData) => {
    try {
      const { component, reason, granted, metadata } = logData
      PermissionManager.logPermissionRequest(component, reason, granted, metadata)
      return { success: true }
    } catch (error) {
      logger.error("PermissionHandler", "Failed to log permission request", {
        error: error.message,
      })
      return { success: false, error: error.message }
    }
  })
}

export default setupPermissionHandlers
