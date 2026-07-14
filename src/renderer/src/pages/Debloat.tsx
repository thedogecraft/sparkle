import { useState, useEffect, useCallback } from "react"
import RootDiv from "@/components/rootdiv"
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table"
import Checkbox from "@/components/ui/Checkbox"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { invoke } from "@/lib/electron"
import { RefreshCw, Search, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "react-toastify"
import { LargeInput } from "@/components/ui/input"
import sparkleLogo from "../../../../resources/sparklelogo.png"

interface InstalledApp {
  id: string
  name: string
  publisher: string
  version: string
  installDate: string
  icon?: string
  uninstallString: string
  quietUninstallString: string
  isStoreApp: boolean
  packageName: string
}

function Debloat() {
  const [apps, setApps] = useState<InstalledApp[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [uninstalling, setUninstalling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showWelcome, setShowWelcome] = useState(false)

  const loadApps = useCallback(async function () {
    setLoading(true)
    try {
      const result = await invoke({ channel: "get-installed-apps" })
      setApps(result || [])
    } catch (err) {
      console.error("Failed to load installed apps:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApps()
  }, [loadApps])

  useEffect(() => {
    const onProgress = () => {
      setUninstalling(true)
    }
    const onComplete = () => {
      setUninstalling(false)
      toast.success("Uninstall completed!")
      setSelected(new Set())
      loadApps()
    }

    window.electron.ipcRenderer.on("uninstall-progress", onProgress)
    window.electron.ipcRenderer.on("uninstall-complete", onComplete)

    return () => {
      window.electron.ipcRenderer.removeAllListeners("uninstall-progress")
      window.electron.ipcRenderer.removeAllListeners("uninstall-complete")
    }
  }, [loadApps])

  useEffect(() => {
    const welcomeShown = localStorage.getItem("debloatWelcomeShown")
    if (!welcomeShown) {
      setShowWelcome(true)
    }
  }, [])

  const selectedNames = Array.from(selected)
    .map((id) => apps.find((a) => a.id === id)?.name)
    .filter(Boolean) as string[]

  async function handleUninstall() {
    setShowConfirm(false)
    setUninstalling(true)
    try {
      const selectedApps = Array.from(selected)
        .map((id) => apps.find((a) => a.id === id))
        .filter((a): a is InstalledApp => !!a)
        .map((a) => ({
          name: a.name,
          uninstallString: a.uninstallString,
          quietUninstallString: a.quietUninstallString,
          isStoreApp: a.isStoreApp,
          packageName: a.packageName,
        }))

      const result = await invoke({
        channel: "uninstall-apps",
        payload: selectedApps,
      })
      if (!result?.success) {
        toast.error("Some apps could not be uninstalled.")
      }
    } catch (err) {
      console.error("Uninstall failed:", err)
      toast.error("Failed to uninstall apps.")
    } finally {
      setUninstalling(false)
    }
  }

  const allSelected = apps.length > 0 && selected.size === apps.length
  const someSelected = selected.size > 0 && !allSelected

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(apps.map((a) => a.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function refreshApps() {
    invoke({ channel: "reload-installed-apps" }).then(loadApps)
  }

  return (
    <>
      <Modal open={showWelcome} onOpenChange={() => setShowWelcome(false)}>
        <div className="bg-sparkle-card p-4 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
          <h2 className="text-lg font-semibold">Welcome to Debloat+</h2>
          <p className="mt-2 text-sm text-sparkle-text-secondary">
            Debloat+ allows you to uninstall apps installed on your system rather than picking from
            a list of pre-selected apps.
            <br />
            <br />
            <span className="font-medium text-sparkle-secondary">
              This feature is still in beta
            </span>
            , so please use it with caution. Some apps may not uninstall correctly.
          </p>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                setShowWelcome(false)
                localStorage.setItem("debloatWelcomeShown", "true")
              }}
            >
              Got it!
            </Button>
          </div>
        </div>
      </Modal>

      <RootDiv className="flex flex-col w-full h-full overflow-hidden">
        <Modal open={showConfirm} onClose={() => setShowConfirm(false)}>
          <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <TriangleAlert className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-sparkle-text">Confirm Uninstall</h3>
            </div>
            <p className="text-sm text-sparkle-text-secondary mb-4">
              This will uninstall the following {selectedNames.length} app
              {selectedNames.length !== 1 ? "s" : ""}:
            </p>
            <ul className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 mb-6">
              {selectedNames.map((name) => (
                <li
                  key={name}
                  className="text-sm text-sparkle-text bg-sparkle-accent/50 rounded px-3 py-1.5"
                >
                  {name}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleUninstall} disabled={uninstalling}>
                {uninstalling ? "Uninstalling..." : "Uninstall"}
              </Button>
            </div>
          </div>
        </Modal>

        <div className="flex items-center justify-end mb-4">
          <h1 className="text-2xl font-bold text-sparkle-text mr-auto">
            Installed Apps {!loading && !uninstalling && `(${apps.length})`}
            {uninstalling && (
              <span className="text-sm font-normal text-sparkle-text-secondary ml-2">
                Uninstalling...
              </span>
            )}
          </h1>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={refreshApps}
              disabled={loading || uninstalling}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="danger"
              disabled={selected.size === 0 || uninstalling}
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Uninstall Selected
            </Button>
          </div>
        </div>
        <div className="flex mr-4 mt-4 mb-4 w-full">
          <LargeInput
            placeholder="Search installed apps..."
            className="w-full"
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Table className="mb-2 h-[calc(100%-200px)] ">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected || someSelected} onChange={toggleAll} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Publisher</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Install Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <tr className="border-b border-sparkle-border">
                <td colSpan={5} className="p-4 text-center text-sparkle-text-secondary">
                  Loading installed apps...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr className="border-b border-sparkle-border">
                <td colSpan={5} className="p-4 text-center text-sparkle-text-secondary">
                  No installed apps found.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr
                  key={app.id}
                  className={`border-b border-sparkle-border transition-colors hover:bg-sparkle-accent/50 cursor-pointer ${selected.has(app.id) ? "bg-sparkle-accent/30" : ""}`}
                  onClick={() => !uninstalling && toggleOne(app.id)}
                >
                  <td className="p-4 align-middle text-sparkle-text w-10">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(app.id)} onChange={() => toggleOne(app.id)} />
                    </div>
                  </td>
                  <td className="align-middle text-sparkle-text">
                    <div className="flex items-center gap-2">
                      {app.icon ? (
                        <img src={app.icon} alt={app.name} className="w-5 h-5" />
                      ) : (
                        <img src={sparkleLogo} alt={app.name} className="w-5 h-5" />
                      )}
                      <span>{app.name}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-sparkle-text">{app.publisher}</td>
                  <td className="p-4 align-middle text-sparkle-text">{app.version}</td>
                  <td className="p-4 align-middle text-sparkle-text">{app.installDate}</td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-sparkle-text-secondary">
          Apps are cached locally for performance. You can refresh the list at any time.
        </p>
      </RootDiv>
    </>
  )
}

export default Debloat
