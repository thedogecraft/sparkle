import { logger } from "./logger.js"

class PermissionManager {
  static requiresAdminElevation(operationType) {
    const adminOperations = [
      "registry_modification",
      "system_service",
      "device_driver",
      "network_adapter",
      "firewall",
      "windows_defender",
      "task_scheduler",
      "group_policy",
      "power_settings",
      "file_system_permission",
      "startup_app",
      "scheduled_task",
      "system_restore",
    ]

    return adminOperations.includes(operationType)
  }

  static getTweakPermissions(tweak) {
    return {
      requiresAdmin: true,
      riskLevel: this.calculateRiskLevel(tweak),
      affectedAreas: this.identifyAffectedAreas(tweak),
      isReversible: tweak.reversible !== false,
      requiresRestart: tweak.requiresRestart || false,
    }
  }

  static calculateRiskLevel(tweak) {
    const criticalPatterns = [
      "uninstall",
      "remove",
      "disable.*defender",
      "disable.*antivirus",
      "delete.*file",
      "erase",
    ]

    const highPatterns = [
      "registry.*hklm",
      "system.*service",
      "startup",
      "boot",
      "kernel",
      "core",
    ]

    const description = (tweak.description || "").toLowerCase()
    const title = (tweak.title || "").toLowerCase()
    const combined = `${title} ${description}`

    for (const pattern of criticalPatterns) {
      if (new RegExp(pattern, "i").test(combined)) return "critical"
    }

    for (const pattern of highPatterns) {
      if (new RegExp(pattern, "i").test(combined)) return "high"
    }

    return tweak.reversible === false ? "high" : "medium"
  }

  static identifyAffectedAreas(tweak) {
    const areas = []
    const combined = `${tweak.title || ""} ${tweak.description || ""}`.toLowerCase()

    const areaPatterns = {
      "Windows Registry": /registry|regedit|hkey|hklm|hkcu/i,
      "System Services": /service|svc|startup|boot/i,
      "File System": /file|folder|directory|delete|remove/i,
      "Network": /dns|network|adapter|firewall|vpn/i,
      "Display/GPU": /display|gpu|graphics|nvidia|amd|intel/i,
      "Power Settings": /power|sleep|hibernation|standby/i,
      "User Interface": /ui|taskbar|theme|font|animation|visual/i,
      "Gaming": /game|gaming|directx|vulkan|latency/i,
      "Privacy": /privacy|tracking|telemetry|data/i,
    }

    for (const [area, pattern] of Object.entries(areaPatterns)) {
      if (pattern.test(combined)) {
        areas.push(area)
      }
    }

    return areas.length > 0 ? areas : ["System"]
  }

  static logPermissionRequest(component, reason, granted, metadata = {}) {
    logger.logPermissionRequest(component, reason, granted)
  }

  static getPermissionWarningMessage(permissions) {
    let message = "Administrator access required to apply this tweak.\n\n"

    if (permissions.riskLevel === "critical") {
      message += "⚠️ CRITICAL RISK: This tweak makes significant system changes.\n"
    } else if (permissions.riskLevel === "high") {
      message += "⚠️ HIGH RISK: This tweak makes important system changes.\n"
    } else {
      message += "ℹ️ This tweak requires administrator permissions.\n"
    }

    if (!permissions.isReversible) {
      message += "❌ This tweak cannot be automatically reverted.\n"
    } else {
      message += "✓ This tweak can be reverted if needed.\n"
    }

    if (permissions.requiresRestart) {
      message += "🔄 A system restart may be required.\n"
    }

    if (permissions.affectedAreas && permissions.affectedAreas.length > 0) {
      message += `\nAffected Areas: ${permissions.affectedAreas.join(", ")}`
    }

    return message
  }
}

export default PermissionManager
