import { useEffect, useRef, useState } from "react"
import { clsx } from "clsx"
import RootDiv from "@/components/rootdiv"
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table"
import Button from "@/components/ui/button"
import { LargeInput } from "@/components/ui/input"
import OsUpdateCard from "@/components/OsUpdateCard"
import DriversTab from "@/components/DriversTab"
import { invoke } from "@/lib/electron"
import useAppUpdatesStore from "@/store/appUpdatesStore"
import useAppInstallStore from "@/store/appInstallStore"
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCw,
  Search,
  TriangleAlert,
  XCircle,
  ArrowUpCircle,
} from "lucide-react"
import { toast } from "react-toastify"

type SubTab = "apps" | "drivers"

function AppUpdates() {
  const { updates, checking, updating, wingetInstalled, lastChecked, error, check, upgrade } =
    useAppUpdatesStore()
  const installApps = useAppInstallStore((s) => s.apps)
  const [searchTerm, setSearchTerm] = useState("")
  const [wingetInstalling, setWingetInstalling] = useState(false)
  const [subTab, setSubTab] = useState<SubTab>("apps")
  const tabRefs = useRef<Record<SubTab, HTMLButtonElement | null>>({ apps: null, drivers: null })
  const tabBarRef = useRef<HTMLDivElement | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const updateIndicator = () => {
      const ref = tabRefs.current[subTab]
      const container = tabBarRef.current
      if (ref && container) {
        const tabRect = ref.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        setIndicatorStyle({ left: tabRect.left - containerRect.left, width: tabRect.width })
      }
    }
    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [subTab])

  useEffect(() => {
    if (useAppUpdatesStore.getState().lastChecked === null) check()
  }, [check])

  useEffect(() => {
    const { setAppStatus, addAppLog } = useAppInstallStore.getState()
    const listeners: Record<string, (event: unknown, payload: any) => void> = {
      "install-start": (_e, { appId }) => setAppStatus(appId, "installing"),
      "install-output": (_e, { appId, line }) => addAppLog(appId, line),
      "install-app-complete": (_e, { appId }) => setAppStatus(appId, "complete"),
      "install-app-error": (_e, { appId }) => setAppStatus(appId, "error"),
    }
    Object.entries(listeners).forEach(([channel, fn]) => {
      window.electron.ipcRenderer.on(channel, fn)
    })
    return () => {
      Object.entries(listeners).forEach(([channel, fn]) => {
        window.electron.ipcRenderer.removeListener(channel, fn)
      })
    }
  }, [])

  async function installWinget() {
    setWingetInstalling(true)
    try {
      const result = await invoke({ channel: "install-winget" })
      if (result?.success ?? result?.installed) {
        toast.success("Winget installed successfully!")
        await check()
      } else {
        toast.error("Failed to install winget.")
      }
    } catch {
      toast.error("Failed to install winget.")
    } finally {
      setWingetInstalling(false)
    }
  }

  const filtered = updates.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const statusFor = (id: string) => installApps.find((a) => a.id === id)?.status

  const subTabs: { id: SubTab; label: string }[] = [
    { id: "apps", label: "Apps" },
    { id: "drivers", label: "Drivers" },
  ]

  return (
    <RootDiv className="flex flex-col w-full h-full overflow-hidden">
      <div ref={tabBarRef} className="relative flex items-center gap-1 mb-4 border-b border-sparkle-border">
        {subTabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el
            }}
            onClick={() => setSubTab(t.id)}
            className={clsx(
              "px-4 py-2 text-sm font-medium relative z-10 transition-colors",
              subTab === t.id
                ? "text-sparkle-primary"
                : "text-sparkle-text-secondary hover:text-sparkle-text",
            )}
          >
            {t.label}
          </button>
        ))}
        <div
          className="absolute bottom-0 h-0.5 bg-sparkle-primary rounded-full"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            transition: "left 0.2s ease, width 0.2s ease",
          }}
        />
      </div>

      {/* Shown regardless of which tab is active -- Windows Update isn't
          app- or driver-specific, and hiding it behind a tab meant it was
          easy to miss entirely. */}
      <OsUpdateCard />

      {subTab === "apps" ? (
        wingetInstalled === false ? (
          <div className="bg-sparkle-card border border-amber-500/40 rounded-2xl p-6 max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <TriangleAlert className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-sparkle-text">Winget is not installed</h3>
            </div>
            <p className="text-sm text-sparkle-text-secondary mb-4">
              App Updates uses the Windows Package Manager (winget) to find and install app
              updates. Install it to continue.
            </p>
            <Button onClick={installWinget} disabled={wingetInstalling} className="flex items-center gap-2">
              {wingetInstalling && <Loader2 className="w-4 h-4 animate-spin" />}
              {wingetInstalling ? "Installing..." : "Install Winget"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end mb-4">
              <h1 className="text-2xl font-bold text-sparkle-text mr-auto">
                Apps {!checking && !updating && updates.length > 0 && `(${updates.length})`}
                {updating && (
                  <span className="text-sm font-normal text-sparkle-text-secondary ml-2">Updating...</span>
                )}
              </h1>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={check}
                  disabled={checking || updating}
                  className="flex items-center gap-2"
                >
                  <RotateCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  disabled={updates.length === 0 || checking || updating}
                  onClick={() => upgrade(updates)}
                  className="flex items-center gap-2"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Update All
                </Button>
              </div>
            </div>

            <div className="flex mr-4 mt-4 mb-4 w-full">
              <LargeInput
                placeholder="Search updates..."
                className="w-full"
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {error && (
              <div className="mb-3 text-sm text-red-500 flex items-center gap-2">
                <TriangleAlert className="w-4 h-4" />
                {error}
              </div>
            )}

            <Table className="mb-2 h-[calc(100%-320px)]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-32 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checking && updates.length === 0 ? (
                  <tr className="border-b border-sparkle-border">
                    <td colSpan={5} className="p-4 text-center text-sparkle-text-secondary">
                      Checking for updates...
                    </td>
                  </tr>
                ) : updates.length === 0 ? (
                  <tr className="border-b border-sparkle-border">
                    <td colSpan={5} className="p-8 text-center text-sparkle-text-secondary">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      You&apos;re up to date.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr className="border-b border-sparkle-border">
                    <td colSpan={5} className="p-4 text-center text-sparkle-text-secondary">
                      No updates match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const status = statusFor(u.id)
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-sparkle-border transition-colors hover:bg-sparkle-accent/50"
                      >
                        <td className="p-4 align-middle text-sparkle-text">
                          <div className="flex flex-col">
                            <span>{u.name}</span>
                            <span className="text-xs text-sparkle-text-muted">{u.id}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sparkle-text-secondary">
                          {u.currentVersion}
                        </td>
                        <td className="p-4 align-middle">
                          <span className="flex items-center gap-1 text-sparkle-primary">
                            <ArrowRight className="w-3 h-3" />
                            {u.availableVersion}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-sparkle-text-secondary">{u.source}</td>
                        <td className="p-4 align-middle text-center">
                          {status === "installing" ? (
                            <Loader2 className="w-4 h-4 animate-spin text-sparkle-primary mx-auto" />
                          ) : status === "complete" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                          ) : status === "error" ? (
                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => upgrade([u])}
                              disabled={updating || checking}
                            >
                              Update
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
            <p className="text-sm text-sparkle-text-secondary">
              App updates are found using winget (covers Microsoft Store apps too) and Chocolatey,
              if installed. Apps that need an interactive installer may fail to update silently;
              you can still update those manually.
              {lastChecked && ` Last checked ${new Date(lastChecked).toLocaleTimeString()}.`}
            </p>
          </>
        )
      ) : (
        <DriversTab />
      )}
    </RootDiv>
  )
}

export default AppUpdates
