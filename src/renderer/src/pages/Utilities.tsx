import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"
import Toggle from "@/components/ui/Toggle"
import {
  GpuIcon,
  HardDrive,
  Monitor,
  GlobeIcon,
  Zap,
  Computer,
  Volume2Icon,
  WifiIcon,
  Wrench,
  Star,
  NetworkIcon,
  BluetoothIcon,
  SearchIcon,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { invoke } from "@/lib/electron"
import { toast } from "react-toastify"
import log from "electron-log/renderer"
import { Dropdown } from "@/components/ui/dropdown"
import Modal from "@/components/ui/modal"
import { LargeInput } from "@/components/ui/input"
import { useTranslation } from "react-i18next"

type Utility = {
  name: string
  command?: string
  description: string
  state: boolean
  icon: React.ReactNode
  type: "button" | "toggle" | "dropdown"
  buttonText?: string
  options?: string[]
  checkScript?: string
  applyScript?: string | Record<string, string>
  unapplyScript?: string
  runScript?: string
}

const utilities: Utility[] = [
  {
    name: "Disk Cleaner",
    command: "cleanmgr",
    description: "Free up space by removing unnecessary files.",
    state: true,
    icon: <HardDrive />,
    type: "button",
    buttonText: "Clean Now",
    runScript: "cleanmgr /sagerun:1",
  },
  {
    name: "Storage Sense",
    description: "Automatically free up space by getting rid of files you don't need.",
    state: true,
    icon: <Computer />,
    type: "toggle",
    checkScript: `
$path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
if (Test-Path $path) {
  $value = Get-ItemProperty -Path $path -Name "01" -ErrorAction SilentlyContinue
  if ($value."01" -eq 1) { Write-Output "enabled" } else { Write-Output "disabled" }
} else {
  Write-Output "disabled"
}`,
    applyScript: `
$path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
if (-not (Test-Path $path)) {
  New-Item -Path $path -Force | Out-Null
}
Set-ItemProperty -Path $path -Name "01" -Value 1`,
    unapplyScript: `
$path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
if (Test-Path $path) {
  Set-ItemProperty -Path $path -Name "01" -Value 0
}`,
  },
  {
    name: "System Information",
    command: "msinfo32",
    description: "View detailed information about your system.",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonText: "View Info",
    runScript: "msinfo32",
  },
  {
    name: "Fast Startup",
    description: "Improve boot times by optimizing startup settings.",
    state: false,
    icon: <Zap />,
    type: "toggle",
    checkScript: `
$path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
if (Test-Path $path) {
    $value = Get-ItemProperty -Path $path -Name "HiberbootEnabled" -ErrorAction SilentlyContinue
    if ($value.HiberbootEnabled -eq 1) { Write-Output "enabled" } else { Write-Output "disabled" }
} else {
    Write-Output "disabled"
}`,
    applyScript: `
powercfg /hibernate on
$path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
if (!(Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "HiberbootEnabled" -Type DWord -Value 1
`,
    unapplyScript: `
$path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
if (Test-Path $path) { Set-ItemProperty -Path $path -Name "HiberbootEnabled" -Type DWord -Value 0 }
`,
  },
  {
    name: "Graphics Driver",
    description: "Restart your graphics driver to fix display issues.",
    state: false,
    icon: <GpuIcon />,
    type: "button",
    buttonText: "Restart",
    runScript: `
$gpus = Get-PnpDevice -Class Display -Status OK -ErrorAction SilentlyContinue
if ($gpus) {
    foreach ($gpu in $gpus) {
        Write-Output "Restarting $($gpu.FriendlyName)..."
        Disable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false
        Start-Sleep -Seconds 2
        Enable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false
    }
    Write-Output "Graphics driver restart completed."
} else {
    Write-Output "No active display devices found."
}
`,
  },
  {
    name: "Windows Search and UI",
    description: "Restart your Windows Search and UI to fix display issues. (May take a while)",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonText: "Restart",
    runScript: `
try {
    Get-AppxPackage Microsoft.Windows.Search | Reset-AppxPackage
    Write-Output "Microsoft.Windows.Search restart completed."
}
catch {
    Write-Output "An error occured while resetting Microsoft.Windows.Search."
}
try {
    Get-AppxPackage MicrosoftWindows.Client.CBS | Reset-AppxPackage
    Write-Output "MicrosoftWindows.Client.CBS restart completed."
}
catch {
    Write-Output "An error occured while resetting MicrosoftWindows.Client.CBS."
}
`,
  },
  {
    name: "Power Plan",
    description: "Choose how your computer manages power and performance.",
    state: false,
    icon: <Monitor />,
    type: "dropdown",
    options: ["Balanced", "High Performance", "Power Saver", "Ultimate Performance"],
    checkScript: `
$current = powercfg /getactivescheme
if ($current -match "Power saver") { Write-Output "Power Saver" }
elseif ($current -match "High performance") { Write-Output "High Performance" }
elseif ($current -match "Ultimate Performance") { Write-Output "Ultimate Performance" }
else { Write-Output "Balanced" }
`,
    applyScript: {
      Balanced: `powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e`,
      "High Performance": `powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`,
      "Power Saver": `powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a`,
      "Ultimate Performance": `
$ultimatePlan = powercfg -l | Select-String "Ultimate Performance"

if (-not $ultimatePlan) {
    Write-Host "Ultimate Performance plan not found. Creating..."
    powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61
} else {
    Write-Host "Ultimate Performance plan already exists."
}

$ultimatePlanGUID = (powercfg -l | Select-String "Ultimate Performance").ToString().Split()[3]

if ($ultimatePlanGUID) {
    powercfg -setactive $ultimatePlanGUID 2>$null
    Write-Host "Ultimate Performance power plan is now active."
} else {
    Write-Host "Failed to find Ultimate Performance plan GUID."
}
`,
    },
  },
  {
    name: "Flush DNS Cache",
    command: "ipconfig /flushdns",
    description: "Fix connection issues by clearing DNS resolver cache.",
    state: false,
    icon: <GlobeIcon />,
    type: "button",
    buttonText: "Flush",
    runScript: `
ipconfig /flushdns
Write-Output "DNS cache flushed."
`,
  },
  {
    name: "Release IP",
    command: "ipconfig /release",
    description: "Release your current IP address and disconnect from the network temporarily.",
    state: false,
    icon: <NetworkIcon />,
    type: "button",
    buttonText: "Release",
    runScript: `
ipconfig /release
Write-Output "IP address released. You are temporarily disconnected from the network."
`,
  },
  {
    name: "Renew IP",
    command: "ipconfig /renew",
    description: "Request a new IP address from the DHCP server.",
    state: false,
    icon: <NetworkIcon />,
    type: "button",
    buttonText: "Renew",
    runScript: `
ipconfig /renew
Write-Output "New IP address obtained successfully."
`,
  },
  {
    name: "Fix Bluetooth",
    description: "Restart Bluetooth services to resolve connectivity issues.",
    state: false,
    icon: <BluetoothIcon />,
    type: "button",
    buttonText: "Fix",
    runScript: `
Stop-Service -Name "bthserv" -Force -ErrorAction SilentlyContinue
Start-Service -Name "bthserv" -ErrorAction SilentlyContinue
Write-Output "Bluetooth services restarted."
`,
  },
  {
    name: "System File Checker",
    command: "sfc /scannow",
    description: "Repair corrupted system files to improve stability.",
    state: false,
    icon: <Wrench />,
    type: "button",
    buttonText: "Repair",
    runScript: `
Start-Process powershell -ArgumentList "-NoExit", "-Command", "sfc /scannow; Write-Output 'System File Checker completed'"

`,
  },
  {
    name: "DISM Health Restore",
    command: "dism /restorehealth",
    description: "Use DISM to repair the Windows image and fix system issues.",
    state: false,
    icon: <Star />,
    type: "button",
    buttonText: "Repair",
    runScript: `
Start-Process powershell -ArgumentList "-NoExit", "-Command", "dism /online /cleanup-image /restorehealth; Write-Output 'DISM Health Restore completed'"

`,
  },
  {
    name: "Check Disk",
    command: "chkdsk",
    description: "Check and fix disk errors on your system.",
    state: false,
    icon: <HardDrive />,
    type: "button",
    buttonText: "Check",
    runScript: `
Start-Process powershell -ArgumentList "-NoExit", "-Command", "chkdsk /f /r /x; Write-Output 'Check Disk completed'"

`,
  },
  {
    name: "Restart Audio Service",
    description: "Fix sound issues by restarting Windows Audio.",
    state: false,
    icon: <Volume2Icon />,
    type: "button",
    buttonText: "Restart",
    runScript: `
Stop-Service -Name "Audiosrv" -Force -ErrorAction SilentlyContinue
Start-Service -Name "Audiosrv" -ErrorAction SilentlyContinue
Write-Output "Audio service restarted."
`,
  },
  {
    name: "Network Reset",
    command: "netsh",
    description: "Reset your network stack to fix connectivity problems.",
    state: false,
    icon: <WifiIcon />,
    type: "button",
    buttonText: "Reset",
    runScript: `
netsh winsock reset
netsh int ip reset
Write-Output "Network stack reset. Restart your PC to apply changes."
`,
  },
]

function Utilities() {
  const { t } = useTranslation()
  const [dropdownValues, setDropdownValues] = useState<Record<string, string>>({})
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")

  const utilNameMap: Record<string, string> = useMemo(() => ({
    "Disk Cleaner": t("utilities.diskCleaner"),
    "Storage Sense": t("utilities.storageSense"),
    "System Information": t("utilities.sysInfo"),
    "Fast Startup": t("utilities.fastStartup"),
    "Graphics Driver": t("utilities.graphicsDriver"),
    "Windows Search and UI": t("utilities.winSearchUI"),
    "Power Plan": t("utilities.powerPlan"),
    "Flush DNS Cache": t("utilities.flushDNS"),
    "Release IP": t("utilities.releaseIP"),
    "Renew IP": t("utilities.renewIP"),
    "Fix Bluetooth": t("utilities.fixBluetooth"),
    "System File Checker": t("utilities.sfc"),
    "DISM Health Restore": t("utilities.dism"),
    "Check Disk": t("utilities.checkDisk"),
    "Restart Audio Service": t("utilities.restartAudio"),
    "Network Reset": t("utilities.networkReset"),
  }), [t])

  const utilDescMap: Record<string, string> = useMemo(() => ({
    "Disk Cleaner": t("utilities.diskCleanerDesc"),
    "Storage Sense": t("utilities.storageSenseDesc"),
    "System Information": t("utilities.sysInfoDesc"),
    "Fast Startup": t("utilities.fastStartupDesc"),
    "Graphics Driver": t("utilities.graphicsDriverDesc"),
    "Windows Search and UI": t("utilities.winSearchUIDesc"),
    "Power Plan": t("utilities.powerPlanDesc"),
    "Flush DNS Cache": t("utilities.flushDNSDesc"),
    "Release IP": t("utilities.releaseIPDesc"),
    "Renew IP": t("utilities.renewIPDesc"),
    "Fix Bluetooth": t("utilities.fixBluetoothDesc"),
    "System File Checker": t("utilities.sfcDesc"),
    "DISM Health Restore": t("utilities.dismDesc"),
    "Check Disk": t("utilities.checkDiskDesc"),
    "Restart Audio Service": t("utilities.restartAudioDesc"),
    "Network Reset": t("utilities.networkResetDesc"),
  }), [t])

  const utilBtnMap: Record<string, string> = useMemo(() => ({
    "Clean Now": t("utilities.cleanNow"),
    "View Info": t("utilities.viewInfo"),
    "Restart": t("utilities.restart"),
    "Flush": t("utilities.flush"),
    "Release": t("utilities.release"),
    "Renew": t("utilities.renew"),
    "Fix": t("utilities.fix"),
    "Repair": t("utilities.repair"),
    "Check": t("utilities.check"),
    "Reset": t("utilities.reset"),
  }), [t])

  const filteredUtilities = utilities.filter(
    (util) =>
      util.name.toLowerCase().includes(search.toLowerCase()) ||
      util.description.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    if (localStorage.getItem("utilitiesModalShown") !== "true") {
      setModalOpen(true)
    }
  }, [])

  useEffect(() => {
    const checkAllStates = async () => {
      const checkPromises = utilities.map(async (util) => {
        if (util.type === "toggle" && util.checkScript) {
          setLoadingStates((prev) => ({ ...prev, [util.name]: true }))
          try {
            const result = await invoke({
              channel: "run-powershell",
              payload: {
                script: util.checkScript,
                name: `check-${util.name}`,
              },
            })
            if (result.success) {
              const isEnabled = result.output.trim().toLowerCase() === "enabled"
              setToggleStates((prev) => ({ ...prev, [util.name]: isEnabled }))
            }
          } catch (error) {
            console.error(`Failed to check ${util.name}:`, error)
            log.error(`Failed to check ${util.name}:`, error)
          } finally {
            setLoadingStates((prev) => ({ ...prev, [util.name]: false }))
          }
        } else if (util.type === "dropdown" && util.checkScript) {
          setLoadingStates((prev) => ({ ...prev, [util.name]: true }))
          try {
            const result = await invoke({
              channel: "run-powershell",
              payload: {
                script: util.checkScript,
                name: `check-${util.name}`,
              },
            })
            if (result.success) {
              const value = result.output.trim()
              setDropdownValues((prev) => ({ ...prev, [util.name]: value }))
            }
          } catch (error) {
            console.error(`Failed to check ${util.name}:`, error)
            log.error(`Failed to check ${util.name}:`, error)
          } finally {
            setLoadingStates((prev) => ({ ...prev, [util.name]: false }))
          }
        }
      })

      await Promise.all(checkPromises)
    }

    checkAllStates()
  }, [])

  const handleToggleChange = async (util: Utility, newState: boolean) => {
    toast.dismiss()
    const previousState = toggleStates[util.name]
    setToggleStates((prev) => ({ ...prev, [util.name]: newState }))

    const script = newState ? util.applyScript : util.unapplyScript
    if (script) {
      const loadingToastId = toast.loading(
        `${newState ? "Applying" : "Unapplying"} ${utilNameMap[util.name] || util.name}...`,
      )
      try {
        const result = await invoke({
          channel: "run-powershell",
          payload: {
            script,
            name: `${newState ? "apply" : "unapply"}-${util.name}`,
          },
        })
        if (!result.success) {
          throw new Error(result.error || "Failed to execute script")
        }
        toast.update(loadingToastId, {
          render: `${newState ? "Applied" : "Unapplied"} ${utilNameMap[util.name] || util.name}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } catch (error) {
        console.error(`Error toggling ${util.name}:`, error)
        log.error(`Error toggling ${util.name}:`, error)
        setToggleStates((prev) => ({ ...prev, [util.name]: previousState }))
        toast.update(loadingToastId, {
          render: `Failed to ${newState ? "apply" : "unapply"} ${utilNameMap[util.name] || util.name}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
      }
    }
  }

  const handleDropdownChange = async (util: Utility, value: string) => {
    toast.dismiss()
    const previousValue = dropdownValues[util.name]
    setDropdownValues((prev) => ({ ...prev, [util.name]: value }))

    if (util.applyScript) {
      const script =
        typeof util.applyScript === "object" ? util.applyScript[value] : util.applyScript
      if (script) {
        const loadingToastId = toast.loading(`Applying ${utilNameMap[util.name] || util.name}: ${value}...`)
        try {
          const result = await invoke({
            channel: "run-powershell",
            payload: {
              script,
              name: `apply-${util.name}-${value}`,
            },
          })
          if (!result.success) {
            throw new Error(result.error || "Failed to execute script")
          }
          toast.update(loadingToastId, {
            render: `Applied ${utilNameMap[util.name] || util.name}: ${value}`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          })
        } catch (error) {
          console.error(`Error applying ${util.name}:`, error)
          log.error(`Error applying ${util.name}:`, error)
          setDropdownValues((prev) => ({ ...prev, [util.name]: previousValue }))
          toast.update(loadingToastId, {
            render: `Failed to apply ${utilNameMap[util.name] || util.name}: ${value}`,
            type: "error",
            isLoading: false,
            autoClose: 3000,
          })
        }
      }
    }
  }

  const handleButtonClick = async (util: Utility) => {
    toast.dismiss()
    if (util.runScript) {
      const loadingToastId = toast.loading(`Running ${utilNameMap[util.name] || util.name}...`)
      try {
        const result = await invoke({
          channel: "run-powershell",
          payload: {
            script: util.runScript,
            name: `run-${util.name}`,
          },
        })
        if (!result.success) {
          throw new Error(result.error || "Failed to execute script")
        }
        toast.update(loadingToastId, {
          render: `${utilNameMap[util.name] || util.name} completed`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } catch (error) {
        console.error(`Error running ${util.name}:`, error)
        log.error(`Error running ${util.name}:`, error)
        toast.update(loadingToastId, {
          render: `Failed to run ${utilNameMap[util.name] || util.name}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
      }
    }
  }

  return (
    <>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-2xl max-w-lg w-full mx-4 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-sparkle-text mb-4">
            {t("utilities.whatsNew")}
          </h1>

          <p className="text-sparkle-text-secondary mb-6">
            {t("utilities.redesigned")}
          </p>

          <p className="text-sparkle-text-secondary mb-4 text-sm">
            - {t("utilities.feature1")}
            <br />
            <br />
            - {t("utilities.feature2")}
            <br />
            <br />
            - {t("utilities.feature3")}
            <br />
            <br />
            <p className="text-sparkle-primary">
              - {t("utilities.feature4")}
            </p>
            <br /> <br />
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button
              onClick={() => {
                setModalOpen(false)
                localStorage.setItem("utilitiesModalShown", "true")
              }}
            >
              {t("common.gotIt")}
            </Button>
          </div>
        </div>
      </Modal>

      <RootDiv>
        <div className="flex gap-4 flex-col mb-10 mr-4">
          <LargeInput
            placeholder={t("utilities.searchPlaceholder")}
            className="w-full"
            icon={SearchIcon}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          {filteredUtilities.length === 0 && (
            <p className="text-sparkle-text-secondary flex text-center items-center justify-center gap-2">
              {t("utilities.noMatch")}
            </p>
          )}
          {filteredUtilities !== null &&
            filteredUtilities.map((util) => {
              return (
                <Card className="p-4 flex items-center gap-4" key={util.name}>
                  {util.icon}
                  <div>
                    <div className="flex gap-3 items-center">
                      <h1>{utilNameMap[util.name] || util.name}</h1>{" "}
                      {util.command && (
                        <p className="text-xs text-sparkle-primary">
                          CMD:{" "}
                          <code className="bg-sparkle-border p-0.5 rounded-md">{util.command}</code>
                        </p>
                      )}
                    </div>
                    <p className="text-sm  text-sparkle-text-secondary">{utilDescMap[util.name] || util.description}</p>
                  </div>
                  <div className="flex justify-end ml-auto">
                    {util.type === "toggle" &&
                      (loadingStates[util.name] ? (
                        <div className="w-6 h-6 border-2 border-sparkle-border-secondary border-t-sparkle-primary rounded-full animate-spin" />
                      ) : (
                        <Toggle
                          checked={toggleStates[util.name] || false}
                          onChange={(checked: boolean) => handleToggleChange(util, checked)}
                        />
                      ))}
                    {util.type === "button" && (
                      <Button onClick={() => handleButtonClick(util)}>{util.buttonText ? utilBtnMap[util.buttonText] || util.buttonText : ""}</Button>
                    )}
                    {util.type === "dropdown" &&
                      (loadingStates[util.name] ? (
                        <div className="w-6 h-6 border-2 border-sparkle-border-secondary border-t-sparkle-primary rounded-full animate-spin" />
                      ) : (
                        <Dropdown
                          options={util.options || []}
                          value={dropdownValues[util.name] || util.options?.[0] || ""}
                          onChange={(value) => handleDropdownChange(util, value)}
                        />
                      ))}
                  </div>
                </Card>
              )
            })}
        </div>
      </RootDiv>
    </>
  )
}

export default Utilities
