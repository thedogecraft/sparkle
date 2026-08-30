import { useState, useMemo, useRef, useEffect } from "react"
import data from "../assets/apps.json"
import RootDiv from "@/components/rootdiv"
import { Search, X } from "lucide-react"
import Button from "@/components/ui/button"
import Checkbox from "@/components/ui/Checkbox"
import Modal from "@/components/ui/modal"
import { invoke } from "@/lib/electron"
import { Download } from "lucide-react"
import { Trash } from "lucide-react"
import { ExternalLink } from "lucide-react"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import log from "electron-log/renderer"
import { Upload } from "lucide-react"
import Card from "@/components/ui/Card"
import { LargeInput } from "@/components/ui/input"
import { Dropdown } from "@/components/ui/dropdown"
import useAppInstallStore from "@/store/appInstallStore"
import logo from "../../../../resources/sparklelogo.png"
import { useTranslation } from "react-i18next"

interface AppData {
  name: string
  id: string | string[]
  chocolatey?: string
  category: string
  info: string
  link?: string
  icon: string
  warning?: string
}

interface AppsByCategory {
  [key: string]: AppData[]
}

interface InvokeResult {
  success: boolean
  installed?: boolean
  error?: string
}

const APPS_CACHE_KEY = "sparkle.apps.json"
const APPS_CACHE_TTL_MS = 1000 * 60 * 60 * 1 // this is 1 hour

const APPS_URL =
  "https://raw.githubusercontent.com/parcoil/sparkle/refs/heads/v2/src/renderer/src/assets/apps.json"

interface CachedApps {
  timestamp: number
  apps: AppData[]
}

async function fetchRemoteApps(): Promise<AppData[]> {
  const response = await fetch(APPS_URL)
  if (!response.ok) throw new Error(`Failed to fetch apps list (${response.status})`)
  const appsData = await response.json()
  return appsData.apps || []
}

function loadCachedApps(): CachedApps | null {
  try {
    const raw = localStorage.getItem(APPS_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedApps
    if (!Array.isArray(cached.apps)) return null
    return cached
  } catch {
    localStorage.removeItem(APPS_CACHE_KEY)
    return null
  }
}

function saveAppsCache(apps: AppData[]): void {
  const cached: CachedApps = { timestamp: Date.now(), apps }
  localStorage.setItem(APPS_CACHE_KEY, JSON.stringify(cached))
}

const isCacheFresh = (cached: CachedApps): boolean =>
  Date.now() - cached.timestamp < APPS_CACHE_TTL_MS

function LazyApp({ delay, children }: { delay: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "300px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={visible ? "animate-in fade-in duration-500" : ""}
    >
      {visible ? (
        children
      ) : (
        <Card className="p-4 animate-pulse border-sparkle-border">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-sparkle-accent" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-1/2 rounded bg-sparkle-accent" />
              <div className="h-2 w-3/4 rounded bg-sparkle-accent/60" />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function Apps() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importedApps, setImportedApps] = useState<string[]>([])
  const [selectedImportedApps, setSelectedImportedApps] = useState<string[]>([])
  const [appsList, setAppsList] = useState<AppData[]>([])
  const [wingetInstalled, setWingetInstalled] = useState<boolean | null>(null)
  const [wingetChecking, setWingetChecking] = useState<boolean>(false)
  const [wingetInstalling, setWingetInstalling] = useState<boolean>(false)
  const [source, setSource] = useState<"Chocolatey" | "Winget">(
    (localStorage.getItem("defaultPackageManager") as "Chocolatey" | "Winget") || "Winget",
  )
  const [showSelectedAppsModal, setShowSelectedAppsModal] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false)

  const [chocolateyInstalled, setChocolateyInstalled] = useState<boolean | null>(null)
  const [chocolateyChecking, setChocolateyChecking] = useState<boolean>(false)
  const [chocolateyInstalling, setChocolateyInstalling] = useState<boolean>(false)
  const [hideAppIcons, _setHideAppIcons] = useState<boolean>(
    localStorage.getItem("hideAppsPageAppIcons") === "true",
  )

  const { addApp, apps: installingApps, setAction, addAppLog, setAppStatus } = useAppInstallStore()

  const router = useNavigate()

  const filteredApps = appsList
    .filter((app: AppData) => app.name.toLowerCase().includes(search.toLowerCase()))
    .filter((app: AppData) => {
      if (source === "Chocolatey") {
        return (app as any).chocolatey !== undefined
      }
      if (source === "Winget") {
        return (app as any).id !== undefined
      }
      return true
    })

  // Helper function to get the app ID based on current source
  const getAppIdForSource = (app: AppData): string => {
    if (source === "Chocolatey" && app.chocolatey) {
      return app.chocolatey
    }
    return Array.isArray(app.id) ? app.id[0] : app.id
  }

  const exportSelectedApps = () => {
    const blob = new Blob([JSON.stringify(selectedApps, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sparkle-apps.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSelectedApps = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result) throw new Error("File read error")
        const parsed = JSON.parse(e.target.result as string)
        if (Array.isArray(parsed)) {
          setImportedApps(parsed)
          setSelectedImportedApps(parsed)
          setImportModalOpen(true)
        } else {
          toast.error(t("apps.invalidFormat"))
        }
      } catch {
        toast.error(t("apps.failedParseJSON"))
      } finally {
        event.target.value = ""
      }
    }
    reader.readAsText(file)
  }

  const appsByCategory = useMemo(() => {
    return filteredApps.reduce<AppsByCategory>((acc, app) => {
      if (!acc[app.category]) acc[app.category] = []
      acc[app.category].push(app)
      return acc
    }, {})
  }, [filteredApps])

  const checkWinget = async (): Promise<void> => {
    setWingetChecking(true)
    try {
      const result = (await invoke({ channel: "check-winget" })) as InvokeResult
      if (result.success) {
        setWingetInstalled(result.installed ?? false)
      } else {
        console.warn("Failed to check Winget status:", result.error)
        setWingetInstalled(false)
      }
    } catch (error) {
      console.error("Error checking Winget:", error)
      setWingetInstalled(false)
    } finally {
      setWingetChecking(false)
    }
  }

  const handleSourceSelect = (selectedSource: "Chocolatey" | "Winget") => {
    setSource(selectedSource)
    localStorage.setItem("defaultPackageManager", selectedSource)
    localStorage.setItem("hasSeenAppsWelcomeModal", "true")
    setShowWelcomeModal(false)
  }

  const installWinget = async (): Promise<void> => {
    setWingetInstalling(true)
    try {
      await invoke({ channel: "install-winget" })
      toast.success(t("apps.wingetInstalledSuccess"))
      await checkWinget()
    } catch (error) {
      console.error("Error installing Winget:", error)
      toast.error(t("apps.failedInstallWinget"))
    } finally {
      setWingetInstalling(false)
    }
  }

  const checkChocolatey = async (): Promise<void> => {
    setChocolateyChecking(true)
    try {
      const result = (await invoke({ channel: "check-chocolatey" })) as InvokeResult
      if (result.success) {
        setChocolateyInstalled(result.installed ?? false)
      } else {
        console.warn("Failed to check Chocolatey status:", result.error)
        setChocolateyInstalled(false)
      }
    } catch (error) {
      console.error("Error checking Chocolatey:", error)
      setChocolateyInstalled(false)
    } finally {
      setChocolateyChecking(false)
    }
  }

  const installChocolatey = async (): Promise<void> => {
    setChocolateyInstalling(true)
    try {
      await invoke({ channel: "install-chocolatey" })
      toast.success(t("apps.chocoInstalledSuccess"), {
        autoClose: false,
      })
      await checkChocolatey()
    } catch (error) {
      console.error("Error installing Chocolatey:", error)
      toast.error(t("apps.failedInstallChoco"))
    } finally {
      setChocolateyInstalling(false)
    }
  }

  const toggleApp = (appId: string): void => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((selectedId) => selectedId !== appId) : [...prev, appId],
    )
  }

  useEffect(() => {
    const loadApps = async () => {
      if (import.meta.env.DEV || localStorage.getItem("forceLocalApps") === "true") {
        setAppsList((data as { apps: AppData[] }).apps || [])
        return
      }

      const cached = loadCachedApps()

      if (cached && isCacheFresh(cached)) {
        // Serve fresh cache immediately without a network request
        setAppsList(cached.apps)
        return
      }

      // Serve any cached data right away, refresh in the background if stale
      if (cached) setAppsList(cached.apps)

      try {
        const apps = await fetchRemoteApps()
        setAppsList(apps)
        saveAppsCache(apps)
      } catch (error) {
        console.error("Failed to refresh apps list", error)
        if (!cached) {
          toast.error("Failed to fetch apps list (Using local apps.json)")
          setAppsList((data as { apps: AppData[] }).apps || [])
        }
      }
    }

    loadApps()
    checkWinget()
    checkChocolatey()

    const handleInstallStart = (_event: any, data: { appId: string }) => {
      setAppStatus(data.appId, "installing")
    }

    const handleInstallOutput = (_event: any, data: { appId: string; line: string }) => {
      addAppLog(data.appId, data.line)
    }

    const handleInstallAppComplete = (_event: any, data: { appId: string }) => {
      setAppStatus(data.appId, "complete")
    }

    const handleInstallAppError = (_event: any, data: { appId: string }) => {
      setAppStatus(data.appId, "error")
    }

    const handleInstallComplete = () => {
      setTimeout(() => {
        useAppInstallStore.getState().clearApps()
      }, 3000)
    }

    const handleInstallError = () => {
      toast.error("An error occurred during installation")
    }

    window.electron.ipcRenderer.on("install-start", handleInstallStart)
    window.electron.ipcRenderer.on("install-output", handleInstallOutput)
    window.electron.ipcRenderer.on("install-app-complete", handleInstallAppComplete)
    window.electron.ipcRenderer.on("install-app-error", handleInstallAppError)
    window.electron.ipcRenderer.on("install-complete", handleInstallComplete)
    window.electron.ipcRenderer.on("install-error", handleInstallError)

    return () => {
      window.electron.ipcRenderer.removeListener("install-start", handleInstallStart)
      window.electron.ipcRenderer.removeListener("install-output", handleInstallOutput)
      window.electron.ipcRenderer.removeListener("install-app-complete", handleInstallAppComplete)
      window.electron.ipcRenderer.removeListener("install-app-error", handleInstallAppError)
      window.electron.ipcRenderer.removeListener("install-complete", handleInstallComplete)
      window.electron.ipcRenderer.removeListener("install-error", handleInstallError)
    }
  }, [])

  useEffect(() => {
    setSelectedApps([]) // reset selections when switching sources
    if (source === "Chocolatey") {
      checkChocolatey()
    }
  }, [source])

  useEffect(() => {
    const hasSeenWelcomeModal = localStorage.getItem("hasSeenAppsWelcomeModal") === "true"
    if (!hasSeenWelcomeModal) {
      setShowWelcomeModal(true)
    }
  }, [])

  const handleAppAction = async (type: string, appsToUse = selectedApps) => {
    if (appsToUse.length === 0) return

    const actionType = type as "install" | "uninstall"
    setAction(actionType)

    appsToUse.forEach((appId) => {
      const app = appsList.find((a) => getAppIdForSource(a) === appId)
      addApp(appId, app?.name || appId)
    })

    try {
      invoke({
        channel: "handle-apps",
        payload: {
          action: type,
          apps: appsToUse,
          source: source,
        },
      })
    } catch (error) {
      console.error(`Error ${type === "install" ? "installing" : "uninstalling"} apps:`, error)
      log.error(`Error ${type === "install" ? "installing" : "uninstalling"} apps:`, error)
    }
  }

  return (
    <>
      <Modal open={showWelcomeModal} onClose={() => setShowWelcomeModal(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-xl font-semibold text-sparkle-text mb-3">
            {t("apps.welcome")}
          </h3>

          <div className="text-sparkle-text-secondary text-sm leading-6 mb-6">
            <p className="mb-4">
              {t("apps.welcomeDesc")}
              <p className="text-sparkle-secondary">
                {t("apps.selectPackageManager")}
              </p>
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSourceSelect("Winget")}
                className={`w-full p-4 rounded-lg border transition-all text-left bg-sparkle-accent border-sparkle-text-muted hover:bg-sparkle-bg cursor-pointer hover:scale-[102%]`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sparkle-text">{t("apps.wingetName")}</h4>
                    <p className="text-sm text-sparkle-text-secondary">
                      {t("apps.wingetDesc")}
                    </p>
                  </div>
                  {wingetInstalled && (
                    <span className="text-green-500 text-sm font-medium">{t("apps.installed")}</span>
                  )}
                  {!wingetInstalled && !wingetChecking && (
                    <span className="text-amber-500 text-sm font-medium">{t("apps.notInstalled")}</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleSourceSelect("Chocolatey")}
                className={`w-full p-4 rounded-lg border transition-all text-left bg-sparkle-accent border-sparkle-text-muted hover:bg-sparkle-bg cursor-pointer hover:scale-[102%]`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sparkle-text">{t("apps.chocoName")}</h4>
                    <p className="text-sm text-sparkle-text-secondary">
                      {t("apps.chocoDesc")}
                    </p>
                  </div>
                  {chocolateyInstalled && (
                    <span className="text-green-500 text-sm font-medium">{t("apps.installed")}</span>
                  )}
                  {!chocolateyInstalled && !chocolateyChecking && (
                    <span className="text-amber-500 text-sm font-medium">{t("apps.notInstalled")}</span>
                  )}
                </div>
              </button>
            </div>

            {(wingetChecking || chocolateyChecking) && (
              <p className="text-sm text-sparkle-text-secondary mt-4 text-center">
                {t("apps.checkingStatus")}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowWelcomeModal(false)}>
              {t("apps.skipForNow")}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={showSelectedAppsModal} onClose={() => setShowSelectedAppsModal(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-xl font-semibold text-sparkle-text mb-3">
            {t("apps.selectedApps", { count: selectedApps.length })}
          </h3>

          <div className="text-sparkle-text-secondary text-sm leading-6 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar mb-6">
            {selectedApps.length > 0 ? (
              <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {selectedApps.map((appId) => {
                  const app = appsList.find((a) => getAppIdForSource(a) === appId)
                  return (
                    <div className="flex  items-center gap-2" key={appId}>
                      <li key={appId} className="flex items-center gap-2 text-sparkle-text">
                        {app?.name || appId}
                      </li>
                      <p title={t("apps.removeFromSelection")}>
                        <X onClick={() => toggleApp(appId)} className="w-4 h-4 cursor-pointer" />
                      </p>
                    </div>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sparkle-text-secondary italic">{t("apps.noAppsSelected")}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSelectedAppsModal(false)}>
              {t("common.close")}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-xl font-semibold text-sparkle-text mb-3">
            {t("apps.importApps", { count: importedApps.length })}
          </h3>

          <div className="text-sparkle-text-secondary text-sm leading-6 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar mb-6">
            {importedApps.length > 0 ? (
              <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {importedApps.map((id) => {
                  const app = appsList.find((a) => a.id === id)
                  return (
                    <li key={id} className="flex items-center gap-2 text-sparkle-text">
                      <Checkbox
                        checked={selectedImportedApps.includes(id)}
                        onChange={(checked: boolean) => {
                          setSelectedImportedApps((prev) => {
                            if (checked) {
                              return prev.includes(id) ? prev : [...prev, id]
                            } else {
                              return prev.filter((x) => x !== id)
                            }
                          })
                        }}
                      />

                      {app ? app.name : `${t("common.unknown")} App (${id})`}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sparkle-text-secondary italic">{t("apps.noAppsInFile")}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={selectedImportedApps.length === 0}
              onClick={() => {
                setSelectedApps(selectedImportedApps)
                setImportModalOpen(false)
                handleAppAction("install", selectedImportedApps)
              }}
            >
              {t("apps.installSelected")}
            </Button>
          </div>
        </div>
      </Modal>
      <RootDiv>
        <LargeInput
          icon={Search}
          placeholder={t("apps.searchApps", { count: filteredApps.length })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {wingetInstalled === false && (
          <Card className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 w-full mt-5 flex gap-4 items-center">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Download className="text-amber-500" size={24} />
            </div>
            <div className="flex-1">
              <h1 className="font-medium text-sparkle-text">{t("apps.wingetNotInstalled")}</h1>
              <p className="text-sparkle-text-secondary">
                {t("apps.wingetRequired")}
              </p>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-amber-500/20 hover:bg-amber-500/10"
                onClick={installWinget}
                disabled={wingetInstalling || wingetChecking}
              >
                {wingetInstalling ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    {t("apps.installing")}
                  </>
                ) : wingetChecking ? (
                  <>{t("apps.checking")}</>
                ) : (
                  <>
                    <Download size={18} /> {t("apps.installWinget")}
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {source === "Chocolatey" && chocolateyInstalled === false && (
          <Card className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 w-full mt-5 flex gap-4 items-center">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Download className="text-amber-500" size={24} />
            </div>
            <div className="flex-1">
              <h1 className="font-medium text-sparkle-text">{t("apps.chocoNotInstalled")}</h1>
              <p className="text-sparkle-text-secondary">
                {t("apps.chocoRequired")}
              </p>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-amber-500/20 hover:bg-amber-500/10"
                onClick={installChocolatey}
                disabled={chocolateyInstalling || chocolateyChecking}
              >
                {chocolateyInstalling ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    {t("apps.installing")}
                  </>
                ) : chocolateyChecking ? (
                  <>{t("apps.checking")}</>
                ) : (
                  <>
                    <Download size={18} /> {t("apps.installChoco")}
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        <div className="flex gap-3 mt-5 w-auto ml-1 mr-1">
          {selectedApps.length > 0 && (
            <Button
              variant="outline"
              className="flex gap-2 text-sm h-auto py-1 px-2"
              onClick={() => setShowSelectedAppsModal(true)}
            >
              {t("apps.appsSelected", { count: selectedApps.length, plural: selectedApps.length !== 1 ? "s" : "" })}
            </Button>
          )}
          <Button
            className="text-sparkle-text flex gap-2"
            disabled={selectedApps.length === 0 || installingApps.length > 0}
            onClick={() => handleAppAction("install")}
          >
            <Download className="w-5" />
            {t("apps.installSelected")}
          </Button>
          <Button
            className="flex gap-2"
            variant="danger"
            disabled={selectedApps.length === 0 || installingApps.length > 0}
            onClick={() => handleAppAction("uninstall")}
          >
            <Trash className="w-5" />
            {t("apps.uninstallSelected")}
          </Button>
          <Button
            className="flex gap-2"
            onClick={exportSelectedApps}
            disabled={selectedApps.length === 0}
          >
            <Download className="w-5" />
            {t("apps.exportList")}
          </Button>

          <label className="flex gap-2 cursor-pointer bg-sparkle-border text-sparkle-text rounded-lg font-medium px-3 py-1.5 text-sm text-center items-center active:scale-90 hover:bg-sparkle-secondary transition-all duration-200">
            <Upload className="w-5" />
            {t("apps.importList")}
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importSelectedApps}
            />
          </label>

          {selectedApps.length > 0 && (
            <Button
              className="flex gap-2 ml-auto bg-sparkle-border text-sparkle-text"
              variant="secondary"
              onClick={() => setSelectedApps([])}
            >
              {t("apps.uncheckAll")}
            </Button>
          )}
        </div>
        <p className="mb-2 mt-2 text-sparkle-text-muted font-medium">
          {t("apps.debloatLink")}{""}
          <a className="text-sparkle-primary cursor-pointer" onClick={() => router("/tweaks")}>
            {t("apps.tweaksLink")}
          </a>
        </p>

        <div className="flex flex-row gap-2 items-center">
          {import.meta.env.DEV && (
            <p className=" text-red-500 text-xs">
              {t("apps.devMode")}
            </p>
          )}
          <div className="ml-auto flex gap-2 items-center">
            <p className="text-sparkle-text-muted">{t("apps.selectSource")}</p>
            <Dropdown
              options={["Winget", "Chocolatey"]}
              value={source || "Winget"}
              onChange={(value) => setSource(value as "Chocolatey" | "Winget")}
            />
          </div>
        </div>
        <div className="space-y-10 mb-10">
          {Object.entries(appsByCategory).map(([category, apps]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-2xl text-sparkle-primary font-bold capitalize">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mr-4">
                {apps.map((app) => {
                  const appId = getAppIdForSource(app)
                  return (
                    <LazyApp key={appId} delay={0}>
                      <Card onClick={() => toggleApp(appId)} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedApps.includes(appId)}
                                onChange={() => toggleApp(appId)}
                              />
                            </div>
                            {hideAppIcons !== true && (
                              <div className="min-w-10 max-w-10 max--h-10 min-h-10 rounded-lg overflow-hidden bg-sparkle-accent flex items-center justify-center">
                                {app.icon ? (
                                  <img
                                    src={app.icon}
                                    alt={app.name}
                                    onError={(e) => (e.currentTarget.src = logo)}
                                    className="w-8 h-8 object-contain rounded-md"
                                  />
                                ) : (
                                  <img src="" alt="" className="w-6 h-6 opacity-50" />
                                )}
                              </div>
                            )}
                            <div>
                              <h3 className="text-sparkle-text font-medium group-hover:text-sparkle-primary transition">
                                {app.name}
                              </h3>
                              {app.info && (
                                <p className="text-sm text-sparkle-text-secondary line-clamp-1 font-semibold">
                                  {app.info}
                                </p>
                              )}
                              <p className="text-xs text-sparkle-text-secondary">ID: {appId}</p>
                            </div>
                          </div>
                          {app.link && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                aria-label={`Open ${app.name} website`}
                                className="ml-3 text-sparkle-primary hover:text-sparkle-text-secondary transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  try {
                                    window.open(app.link, "_blank")
                                  } catch (err) {
                                    console.error("Failed to open external link", err)
                                  }
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </LazyApp>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="text-center text-sparkle-text-muted">
            {t("apps.requestApps")}{" "}
            <a
              href="https://github.com/parcoil/sparkle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sparkle-primary"
            >
              {t("apps.github")}
            </a>
          </p>
        </div>
      </RootDiv>
    </>
  )
}

export default Apps
