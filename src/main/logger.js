import log from "electron-log"
import path from "path"
import { app } from "electron"

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
}

class StructuredLogger {
  constructor() {
    this.logo = "[Sparkle]"
  }

  initializeLogging() {
    log.transports.file.level = "debug"
    log.transports.console.level = "debug"

    const userData = app.getPath("userData")
    log.transports.file.resolvePath = () => path.join(userData, "logs", "sparkle.log")

    console.log = this.info.bind(this)
    console.error = this.error.bind(this)
    console.warn = this.warn.bind(this)
  }

  formatLog(level, context, message, data = null) {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: context || "CORE",
      message,
      ...(data && { data }),
    }
  }

  info(context, message = "", data = null) {
    const isLegacyFormat = typeof message === "string" && message.startsWith("[")
    if (isLegacyFormat) {
      log.log(this.formatLog("INFO", context, message, data))
      originalConsole.log(`${this.logo} [${context}] ${message}`)
    } else {
      log.log(this.formatLog("INFO", context, message || context, data))
      originalConsole.log(`${this.logo} [${context}] ${message || context}`)
    }
  }

  error(context, message = "", data = null) {
    const errorData = {
      ...data,
      ...(message instanceof Error && { stack: message.stack, name: message.name }),
    }
    const errorMsg = message instanceof Error ? message.message : message

    log.error(this.formatLog("ERROR", context, errorMsg, errorData))
    originalConsole.error(`${this.logo} [${context}] ERROR: ${errorMsg}`)

    if (message instanceof Error) {
      originalConsole.error(`${this.logo} Stack Trace:`, message.stack)
    }
  }

  warn(context, message = "", data = null) {
    log.warn(this.formatLog("WARN", context, message || context, data))
    originalConsole.warn(`${this.logo} [${context}] WARN: ${message || context}`)
  }

  debug(context, message = "", data = null) {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG) {
      log.debug(this.formatLog("DEBUG", context, message || context, data))
      originalConsole.debug(`${this.logo} [${context}] DEBUG: ${message || context}`)
    }
  }

  logPowerShellExecution(scriptName, script, output, error = null) {
    const logData = {
      scriptName,
      scriptLength: script.length,
      timestamp: new Date().toISOString(),
      succeeded: !error,
    }

    if (error) {
      this.error("PowerShell", `Script execution failed: ${scriptName}`, {
        ...logData,
        error,
        output,
      })
    } else {
      this.debug("PowerShell", `Script executed successfully: ${scriptName}`, {
        ...logData,
        outputLength: output?.length || 0,
      })
    }
  }

  logTweakAction(tweakName, action, success, error = null) {
    const context = "TweakHandler"
    const logData = {
      tweakName,
      action,
      timestamp: new Date().toISOString(),
    }

    if (success) {
      this.info(context, `Tweak ${action}ed successfully: ${tweakName}`, logData)
    } else {
      this.error(context, `Failed to ${action} tweak: ${tweakName}`, {
        ...logData,
        error,
      })
    }
  }

  logSystemOperation(operation, details, success = true, data = null) {
    const context = "SystemOperation"
    if (success) {
      this.info(context, `${operation}: ${details}`, data)
    } else {
      this.error(context, `${operation} failed: ${details}`, data)
    }
  }

  logPermissionRequest(component, reason, granted) {
    this.info("PermissionManager", `Elevation ${granted ? "granted" : "denied"} for ${component}`, {
      component,
      reason,
      granted,
      timestamp: new Date().toISOString(),
    })
  }

  getLogFilePath() {
    const userData = app.getPath("userData")
    return path.join(userData, "logs", "sparkle.log")
  }

  logAudit(action, target, beforeState = null, afterState = null) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action,
      target,
      ...(beforeState && { beforeState }),
      ...(afterState && { afterState }),
    }

    this.debug("Audit", `Action logged: ${action} on ${target}`, auditLog)
  }
}

export const logger = new StructuredLogger()

export default StructuredLogger
