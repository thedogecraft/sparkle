import { useEffect, useState } from "react"
import { invoke } from "@/lib/electron"
import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import log from "electron-log/renderer"
import useRestartStore from "@/store/restartState"
import { AlertTriangle, Check, Download, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react"
import WindowsIcon from "@/components/windowsIcon"

type UpdateModeId = "default" | "recommended" | "disabled"

const checkScript = String.raw`
$au = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU"
$wu = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"

$noAuto = (Get-ItemProperty -Path $au -Name "NoAutoUpdate" -ErrorAction SilentlyContinue).NoAutoUpdate
$defer = (Get-ItemProperty -Path $wu -Name "DeferFeatureUpdatesPeriodInDays" -ErrorAction SilentlyContinue).DeferFeatureUpdatesPeriodInDays

if ($noAuto -eq 1) {
    Write-Output "disabled"
} elseif ($defer -eq 365) {
    Write-Output "recommended"
} else {
    Write-Output "default"
}
`

const recommendedScript = String.raw`
Write-Host "Applying recommended Windows Update settings..."

$windowsUpdatePolicyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"
$automaticUpdatePolicyPath = Join-Path $windowsUpdatePolicyPath "AU"

Remove-ItemProperty -Path $automaticUpdatePolicyPath -Name "NoAutoUpdate" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config" -Name "DODownloadMode" -ErrorAction SilentlyContinue

Set-Service -Name BITS -StartupType Manual
Set-Service -Name wuauserv -StartupType Manual
Set-Service -Name UsoSvc -StartupType Automatic
Start-Service -Name UsoSvc

$Tasks =
    '\Microsoft\Windows\InstallService\*',
    '\Microsoft\Windows\UpdateOrchestrator\*',
    '\Microsoft\Windows\UpdateAssistant\*',
    '\Microsoft\Windows\WaaSMedic\*',
    '\Microsoft\Windows\WindowsUpdate\*',
    '\Microsoft\WindowsUpdate\*'

foreach ($Task in $Tasks) {
    Get-ScheduledTask -TaskPath $Task -ErrorAction SilentlyContinue | Enable-ScheduledTask -ErrorAction SilentlyContinue
}

New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Device Metadata" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Device Metadata" -Name "PreventDeviceMetadataFromNetwork" -Type DWord -Value 1

New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Name "DontPromptForWindowsUpdate" -Type DWord -Value 1
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Name "DontSearchWindowsUpdate" -Type DWord -Value 1
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Name "DriverUpdateWizardWuSearchEnabled" -Type DWord -Value 0

New-Item -Path $windowsUpdatePolicyPath -Force | Out-Null
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "ExcludeWUDriversInQualityUpdate" -Type DWord -Value 1

Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferFeatureUpdates" -Type DWord -Value 1
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferFeatureUpdatesPeriodInDays" -Type DWord -Value 365
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferQualityUpdates" -Type DWord -Value 1
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferQualityUpdatesPeriodInDays" -Type DWord -Value 4

$legacySettingsPath = "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings"
foreach ($legacyValue in @("BranchReadinessLevel", "DeferFeatureUpdatesPeriodInDays", "DeferQualityUpdatesPeriodInDays")) {
    Remove-ItemProperty -Path $legacySettingsPath -Name $legacyValue -ErrorAction SilentlyContinue
}

New-Item -Path $automaticUpdatePolicyPath -Force | Out-Null
Remove-ItemProperty -Path $automaticUpdatePolicyPath -Name "NoAutoRebootWithLoggedOnUsers" -ErrorAction SilentlyContinue
Set-ItemProperty -Path $automaticUpdatePolicyPath -Name "AUOptions" -Type DWord -Value 3
Set-ItemProperty -Path $automaticUpdatePolicyPath -Name "AUPowerManagement" -Type DWord -Value 0

Write-Host "Recommended Windows Update settings applied."
`

const defaultScript = String.raw`
Write-Host "Restoring Windows Update to default settings..."

$registryValues = @(
    @{
        Path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU"
        Names = @("NoAutoUpdate", "AUOptions", "NoAutoRebootWithLoggedOnUsers", "AUPowerManagement")
    },
    @{
        Path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"
        Names = @("ExcludeWUDriversInQualityUpdate", "DeferFeatureUpdates", "DeferFeatureUpdatesPeriodInDays", "DeferQualityUpdates", "DeferQualityUpdatesPeriodInDays")
    },
    @{
        Path = "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings"
        Names = @("BranchReadinessLevel", "DeferFeatureUpdatesPeriodInDays", "DeferQualityUpdatesPeriodInDays")
    },
    @{
        Path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Device Metadata"
        Names = @("PreventDeviceMetadataFromNetwork")
    },
    @{
        Path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching"
        Names = @("DontPromptForWindowsUpdate", "DontSearchWindowsUpdate", "DriverUpdateWizardWuSearchEnabled")
    },
    @{
        Path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config"
        Names = @("DODownloadMode")
    }
)

foreach ($registryEntry in $registryValues) {
    foreach ($valueName in $registryEntry.Names) {
        Remove-ItemProperty -Path $registryEntry.Path -Name $valueName -ErrorAction SilentlyContinue
    }
}

$explorerPolicyPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer"
$settingsPageVisibility = (Get-ItemProperty -Path $explorerPolicyPath -Name "SettingsPageVisibility" -ErrorAction SilentlyContinue).SettingsPageVisibility
if ($settingsPageVisibility -eq "hide:windowsupdate") {
    Remove-ItemProperty -Path $explorerPolicyPath -Name "SettingsPageVisibility" -ErrorAction SilentlyContinue
}

Set-Service -Name BITS -StartupType Manual
Set-Service -Name wuauserv -StartupType Manual
Set-Service -Name UsoSvc -StartupType Automatic
Start-Service -Name UsoSvc

$Tasks =
    '\Microsoft\Windows\InstallService\*',
    '\Microsoft\Windows\UpdateOrchestrator\*',
    '\Microsoft\Windows\UpdateAssistant\*',
    '\Microsoft\Windows\WaaSMedic\*',
    '\Microsoft\Windows\WindowsUpdate\*',
    '\Microsoft\WindowsUpdate\*'

foreach ($Task in $Tasks) {
    Get-ScheduledTask -TaskPath $Task -ErrorAction SilentlyContinue | Enable-ScheduledTask -ErrorAction SilentlyContinue
}

Write-Host "Windows Update restored to default."
`

const disableScript = String.raw`
Write-Host "Disabling Windows Update..."

New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoUpdate" -Type DWord -Value 1
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "AUOptions" -Type DWord -Value 1

New-Item -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config" -Name "DODownloadMode" -Type DWord -Value 0

foreach ($serviceName in @("BITS", "wuauserv", "UsoSvc")) {
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Set-Service -Name $serviceName -StartupType Disabled
}

Remove-Item -Path "C:\Windows\SoftwareDistribution\*" -Recurse -Force -ErrorAction SilentlyContinue

$Tasks =
    '\Microsoft\Windows\InstallService\*',
    '\Microsoft\Windows\UpdateOrchestrator\*',
    '\Microsoft\Windows\UpdateAssistant\*',
    '\Microsoft\Windows\WaaSMedic\*',
    '\Microsoft\Windows\WindowsUpdate\*',
    '\Microsoft\WindowsUpdate\*'

foreach ($Task in $Tasks) {
    Get-ScheduledTask -TaskPath $Task -ErrorAction SilentlyContinue | Disable-ScheduledTask -ErrorAction SilentlyContinue
}

Write-Host "Windows Update disabled. Restart required."
`

interface UpdateMode {
  id: UpdateModeId
  label: string
  tagline: string
  icon: React.ReactNode
  iconClass: string
  iconBg: string
  badge?: string
  danger?: boolean
  bullets: string[]
  script: string
  requiresConfirm?: boolean
}

const modes: UpdateMode[] = [
  {
    id: "recommended",
    label: "Recommended",
    tagline: "Best balance of security and stability",
    icon: <ShieldCheck />,
    iconClass: "text-green-500",
    iconBg: "bg-green-500/10",
    badge: "Recommended",
    bullets: [
      "Feature updates delayed by 365 days",
      "Quality updates delayed by 4 days",
      "Drivers are excluded from quality updates",
      "Updates download automatically and notify you when ready to install",
    ],
    script: recommendedScript,
  },
  {
    id: "default",
    label: "Windows Default",
    tagline: "Standard Windows Update behavior",
    icon: <WindowsIcon />,
    iconClass: "text-blue-500",
    iconBg: "bg-blue-500/10",
    bullets: [
      "Removes Sparkle update policies",
      "Restores default update service startup settings",
      "Re-enables update related scheduled tasks",
    ],
    script: defaultScript,
  },
  {
    id: "disabled",
    label: "Disable Updates",
    tagline: "Not recommended",
    icon: <AlertTriangle />,
    iconClass: "text-red-500",
    iconBg: "bg-red-500/10",
    badge: "Not recommended",
    danger: true,
    bullets: [
      "Disables the automatic update policy",
      "Stops and disables update services",
      "Disables update scheduled tasks",
      "Clears downloaded update files",
    ],
    script: disableScript,
    requiresConfirm: true,
  },
]

function Updates() {
  const { setNeedsRestart } = useRestartStore()
  const [currentMode, setCurrentMode] = useState<UpdateModeId | null>(null)
  const [checking, setChecking] = useState(false)
  const [applying, setApplying] = useState<UpdateModeId | null>(null)
  const [pendingMode, setPendingMode] = useState<UpdateMode | null>(null)

  const detectMode = async (silent = false) => {
    if (!silent) setChecking(true)
    try {
      const result = await invoke({
        channel: "run-powershell",
        payload: { script: checkScript, name: "updates-check" },
      })
      if (result.success) {
        const value = result.output.trim().toLowerCase()
        setCurrentMode(
          value === "disabled" || value === "recommended" || value === "default"
            ? value
            : "default",
        )
      }
    } catch (error) {
      log.error("Failed to detect Windows Update mode:", error)
    } finally {
      if (!silent) setChecking(false)
    }
  }

  useEffect(() => {
    detectMode()
  }, [])

  const applyMode = async (mode: UpdateMode) => {
    toast.dismiss()
    setApplying(mode.id)
    const toastId = toast.loading(`Applying ${mode.label}...`)
    try {
      const result = await invoke({
        channel: "run-powershell",
        payload: { script: mode.script, name: `updates-${mode.id}` },
      })
      if (!result.success) {
        throw new Error(result.error || "Failed to execute script")
      }
      toast.update(toastId, {
        render: `${mode.label} applied. Restart Windows to finish.`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      })
      setNeedsRestart(true)
      await detectMode(true)
    } catch (error: any) {
      log.error(`Error applying ${mode.label}:`, error)
      toast.update(toastId, {
        render: `Failed to apply ${mode.label}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      })
    } finally {
      setApplying(null)
      setPendingMode(null)
    }
  }

  const handleSelect = (mode: UpdateMode) => {
    if (applying || mode.id === currentMode) return
    if (mode.requiresConfirm) {
      setPendingMode(mode)
    } else {
      applyMode(mode)
    }
  }

  return (
    <>
      <Modal open={!!pendingMode} onClose={() => setPendingMode(null)}>
        <div className="bg-sparkle-card p-5 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold">Disable Windows Update?</h2>
          </div>
          <p className="text-sparkle-text-secondary mb-4 text-sm">
            Disabling Windows Update stops update services, disables scheduled tasks, and clears
            downloaded update files. Security updates will not be installed until defaults are
            restored. Continue?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPendingMode(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => pendingMode && applyMode(pendingMode)}>
              Disable Updates
            </Button>
          </div>
        </div>
      </Modal>

      <RootDiv>
        <div className="flex flex-col gap-6 pb-10 mr-4">
          <Card className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center p-3 rounded-xl bg-blue-500/10">
              <Download className="text-blue-500" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-sparkle-text mb-1">Windows Updates</h2>
              <p className="text-sm text-sparkle-text-secondary">
                Choose how often Windows should check for updates and how they are installed.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => detectMode()}
              disabled={checking}
              className="flex items-center gap-2"
            >
              {checking ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              <span>Refresh</span>
            </Button>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {modes.map((mode) => {
              const isActive = currentMode === mode.id
              const isApplying = applying === mode.id
              return (
                <Card
                  key={mode.id}
                  className={`relative flex flex-col p-5 ${
                    isActive ? "border-sparkle-primary" : ""
                  } ${mode.danger ? "hover:border-red-500" : ""}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`flex items-center justify-center p-2.5 rounded-xl ${mode.iconBg} ${mode.iconClass}`}
                    >
                      {mode.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sparkle-text">{mode.label}</h3>
                        {mode.badge && (
                          <span
                            className={`text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${
                              mode.danger
                                ? "bg-red-500/10 text-red-500"
                                : "bg-green-500/10 text-green-500"
                            }`}
                          >
                            {mode.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-sparkle-text-secondary mt-0.5">{mode.tagline}</p>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2 mb-5">
                    {mode.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-sparkle-text-secondary"
                      >
                        <Check
                          size={16}
                          className={`mt-0.5 shrink-0 ${mode.danger ? "text-red-500" : "text-sparkle-primary"}`}
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center gap-3">
                    <Button
                      variant={mode.danger ? "danger" : isActive ? "secondary" : "primary"}
                      onClick={() => handleSelect(mode)}
                      disabled={!!applying || isActive}
                      className="flex-1 justify-center gap-2"
                    >
                      {isApplying ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : isActive ? (
                        <Check size={16} />
                      ) : null}
                      <span>
                        {isActive ? "Current Mode" : isApplying ? "Applying..." : "Apply"}
                      </span>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-sparkle-text-secondary">
                After switching modes, you should restart your PC.
              </p>
            </div>
          </Card>
        </div>
      </RootDiv>
    </>
  )
}

export default Updates
