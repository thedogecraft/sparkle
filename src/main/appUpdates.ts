import { ipcMain } from "electron"
import log from "electron-log"
import { executePowerShell, executePowerShellStreaming, checkChocolatey } from "@main/powershell"
import { checkWinget } from "@main/system"
import { mainWindow } from "@main/windowState"
import {
  buildUpgradeListScript,
  buildUpgradeScript,
  orderUpgradeTargets,
  parseWingetUpgradeOutput,
  SAFE_WINGET_ID,
} from "@main/wingetUpgrade"
import { buildOutdatedScript, buildChocoUpgradeScript, parseChocoOutdatedOutput } from "@main/chocoUpgrade"
import type { AppUpdate } from "../types"

const logo = "[Sparkle main/appUpdates.ts]:"

type UpgradeTarget = Pick<AppUpdate, "id" | "name" | "source" | "truncated">

interface CheckResult {
  success: boolean
  wingetInstalled: boolean
  updates: AppUpdate[]
  error?: string
}

function sendToRenderer(channel: string, ...args: any[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

// The launch check and a page mount can fire at once; winget list is slow
// enough that running it twice in parallel is pure waste.
let inFlightCheck: Promise<CheckResult> | null = null

async function checkChocoUpdates(): Promise<AppUpdate[]> {
  const choco = await checkChocolatey()
  if (!choco.installed) return []

  const result = await executePowerShell(null, { script: buildOutdatedScript(), name: "choco-outdated" })
  if (!result.success) {
    log.warn(logo, "choco outdated failed:", result.error)
    return []
  }
  const updates = parseChocoOutdatedOutput(result.output ?? "")
  log.info(logo, `choco outdated -> ${updates.length} updates`)
  return updates
}

async function runCheck(): Promise<CheckResult> {
  const winget = await checkWinget()

  const [wingetUpdates, chocoUpdates] = await Promise.all([
    winget.installed
      ? executePowerShell(null, { script: buildUpgradeListScript(), name: "winget-upgrade-list" })
      : Promise.resolve(null),
    checkChocoUpdates(),
  ])

  if (!winget.installed) {
    // Still surface Chocolatey-only results rather than treating "no
    // winget" as a hard stop -- a machine with only choco installed is a
    // legitimate setup.
    return { success: true, wingetInstalled: false, updates: chocoUpdates }
  }

  if (!wingetUpdates?.success) {
    log.error(logo, "winget upgrade list failed:", wingetUpdates?.error)
    return { success: false, wingetInstalled: true, updates: chocoUpdates, error: wingetUpdates?.error }
  }

  const winUpdates = parseWingetUpgradeOutput(wingetUpdates.output ?? "")
  // Logged because the parser depends on winget's table formatting, which can
  // change between winget versions; this is the breadcrumb if it ever does.
  log.info(logo, `winget output ${wingetUpdates.output?.length ?? 0} chars -> ${winUpdates.length} updates`)

  const updates = [...winUpdates, ...chocoUpdates].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  )
  return { success: true, wingetInstalled: true, updates }
}

export function checkAppUpdates(): Promise<CheckResult> {
  if (inFlightCheck) return inFlightCheck
  inFlightCheck = runCheck().finally(() => {
    inFlightCheck = null
  })
  return inFlightCheck
}

export const setupAppUpdatesHandlers = (): void => {
  ipcMain.handle("app-updates:check", async (): Promise<CheckResult> => {
    try {
      return await checkAppUpdates()
    } catch (error: any) {
      log.error(logo, "check failed:", error)
      return {
        success: false,
        wingetInstalled: true,
        updates: [],
        error: error?.message ?? String(error),
      }
    }
  })

  ipcMain.handle(
    "app-updates:upgrade",
    async (event, { apps }: { apps: UpgradeTarget[] }) => {
      const targets = Array.isArray(apps) ? apps : []
      const results: Array<{ id: string; success: boolean }> = []

      for (const target of orderUpgradeTargets(targets)) {
        const appId = target.id

        // These ids are interpolated into an elevated PowerShell script, so a
        // malformed one is rejected outright rather than sanitised.
        if (typeof appId !== "string" || !SAFE_WINGET_ID.test(appId)) {
          log.warn(logo, "rejected unsafe package id:", appId)
          sendToRenderer("install-start", { appId })
          sendToRenderer("install-output", { appId, line: `Invalid package id: ${appId}` })
          sendToRenderer("install-app-error", { appId })
          results.push({ id: appId, success: false })
          continue
        }

        sendToRenderer("install-start", { appId })
        try {
          const isChoco = target.source === "chocolatey"
          const result = await executePowerShellStreaming(event, {
            script: isChoco ? buildChocoUpgradeScript(appId) : buildUpgradeScript(target),
            name: `Update-${appId}`,
            appId,
          })
          // Both winget and choco exit non-zero when a package turned out to
          // already be current between the check and the upgrade — not a
          // real failure.
          const alreadyCurrent = /no applicable upgrade|no applicable update|already installed/i.test(
            result.output ?? "",
          )
          const success = result.success || alreadyCurrent
          sendToRenderer(success ? "install-app-complete" : "install-app-error", { appId })
          results.push({ id: appId, success })
        } catch (error: any) {
          // One failing app must never abort the rest of the batch.
          log.error(logo, `upgrade failed for ${appId}:`, error)
          sendToRenderer("install-output", { appId, line: error?.message ?? String(error) })
          sendToRenderer("install-app-error", { appId })
          results.push({ id: appId, success: false })
        }
      }

      sendToRenderer("install-complete")
      return { success: true, results }
    },
  )

  log.info(logo, "App updates handlers setup complete")
}

export const cleanupAppUpdatesHandlers = (): void => {
  ipcMain.removeHandler("app-updates:check")
  ipcMain.removeHandler("app-updates:upgrade")
}

export default {
  setupAppUpdatesHandlers,
  cleanupAppUpdatesHandlers,
}
