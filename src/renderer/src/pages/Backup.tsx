import { useEffect, useState } from "react"
import {
  RotateCw,
  PlusCircle,
  Shield,
  RotateCcw,
  Loader2,
  Search,
  Wrench,
  Undo2,
  HelpCircle,
} from "lucide-react"
import RootDiv from "@/components/rootdiv"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import { Trash } from "lucide-react"
import log from "electron-log/renderer"
import { Input, LargeInput } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Tweak } from "@/types/index"
import { useTranslation } from "react-i18next"

type RestorePoint = {
  SequenceNumber: number
  Description: string
  CreationTime: string
  EventType: number
  RestorePointType: number
}

type RestorePointList = RestorePoint[]

function RestorePointsTab() {
  const { t } = useTranslation()
  const [restorePoints, setRestorePoints] = useState<RestorePointList>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: string | null
    restorePoint: any | null
  }>({
    isOpen: false,
    type: null,
    restorePoint: null,
  })

  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  const fetchRestorePoints = async () => {
    setLoading(true)
    try {
      const response = await invoke({ channel: "get-restore-points" })
      if (response.success && Array.isArray(response.points)) {
        const sorted = response.points.sort((a, b) => {
          const parse = (str: string) =>
            new Date(
              `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}T${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)}`,
            ).getTime()

          return parse(b.CreationTime) - parse(a.CreationTime)
        })
        setRestorePoints(sorted)
      } else {
        toast.error(t("backup.failedLoadRestore"))
        log.error("Failed to load restore points:", response)
      }
    } catch (error) {
      toast.error(t("backup.failedLoadRestore"))
      console.error(error)
      log.error("Failed to load restore points:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestorePoints()
  }, [])

  const handleCreateRestorePoint = async () => {
    toast.dismiss()
    setProcessing(true)
    try {
      await invoke({ channel: "create-sparkle-restore-point" })
      toast.success(t("backup.restorePointCreated"))
      await fetchRestorePoints()
    } catch (err) {
      toast.error(t("backup.failedCreateRestore"))
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }

  const handleRestore = (restorePoint) => {
    setModalState({ isOpen: true, type: "restore", restorePoint })
  }

  const executeRestore = async () => {
    setProcessing(true)
    try {
      await invoke({
        channel: "restore-restore-point",
        payload: modalState.restorePoint.SequenceNumber,
      })
      toast.success(t("backup.restoreStarted"))
    } catch (err) {
      toast.error(t("backup.failedStartRestore"))
      log.error("Failed to start system restore:", err)
    }
    setProcessing(false)
    setModalState({ isOpen: false, type: null, restorePoint: null })
  }

  const handleCustomRestorePoint = async () => {
    setProcessing(true)
    try {
      if (!customName.trim()) {
        toast.error(t("backup.enterNameError"))
        setProcessing(false)
        return
      }
      await invoke({ channel: "create-restore-point", payload: customName })
      toast.success(t("backup.restorePointCreated"))
      setCustomModalOpen(false)
      setCustomName("")
      await fetchRestorePoints()
    } catch (err) {
      toast.error(t("backup.failedCreateRestore"))
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }
  const handleDeleteAll = async () => {
    setConfirmDeleteAll(false)
    setProcessing(true)
    await invoke({ channel: "delete-all-restore-points" })
    toast.success(t("backup.allDeleted"))
    setProcessing(false)
    await fetchRestorePoints()
  }
  const filteredRestorePoints = restorePoints.filter((rp: RestorePoint) =>
    (rp.Description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )
  return (
    <>
      <div className="h-full max-w-full space-y-6 ">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative w-full md:w-64 ml-1 mt-1">
            <LargeInput
              placeholder={t("backup.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="danger"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={loading || processing || restorePoints.length === 0}
              className="flex items-center gap-2"
            >
              <Trash size={16} /> {t("backup.deleteAll")}
            </Button>
            <Button
              variant="secondary"
              onClick={fetchRestorePoints}
              className="flex items-center gap-2"
              disabled={loading || processing}
            >
              <RotateCw size={16} /> {t("backup.refresh")}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRestorePoint}
              className="flex items-center gap-2"
              disabled={loading || processing}
            >
              {processing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PlusCircle size={16} />
              )}
              {t("backup.quickRestorePoint")}
            </Button>
            <Button
              variant="primary"
              onClick={() => setCustomModalOpen(true)}
              disabled={loading || processing}
            >
              {t("backup.customRestorePoint")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="text-sparkle-primary animate-spin" />
          </div>
        ) : filteredRestorePoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-sparkle-card border border-sparkle-border rounded-lg">
            <div className="p-4 bg-sparkle-secondary rounded-full mb-4">
              <Shield size={28} className="text-sparkle-text" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-sparkle-text">{t("backup.noRestorePoints")}</h3>
            <p className="text-sparkle-text-secondary max-w-sm mb-4">
              {searchQuery
                ? t("backup.noRestorePointsSearch")
                : t("backup.noRestorePointsDesc")}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                icon={<PlusCircle size={16} />}
                onClick={handleCreateRestorePoint}
                disabled={processing}
              >
                {t("backup.createQuickRestore")}
              </Button>
            )}
          </div>
        ) : (
          <Table className="max-h-96">
            <TableHeader>
              <TableRow>
                <TableHead>{t("backup.description")}</TableHead>
                <TableHead className="w-32 text-center">{t("backup.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestorePoints.map((rp, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rp.Description}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      className="p-2! gap-2"
                      onClick={() => handleRestore(rp)}
                      disabled={processing}
                      title={t("backup.restoreSystem")}
                    >
                      <RotateCcw size={16} />
                      {t("backup.confirmRestore")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        )}
        <p className="text-center text-sparkle-text-muted mt-4">
          {t("backup.betaFeature")}
        </p>
      </div>
      <Modal
        open={modalState.isOpen}
        onClose={() =>
          !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
        }
      >
        {modalState.type === "restore" && modalState.restorePoint && (
          <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
            <h3 className="text-lg font-medium text-sparkle-text">{t("backup.confirmRestore")}</h3>

            <div className="p-4 pr-0">
              <p className="text-sparkle-text-secondary mb-4">
                {t("backup.confirmRestoreDesc", { name: modalState.restorePoint.Description })}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() =>
                    !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
                  }
                  disabled={processing}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" onClick={executeRestore} disabled={processing}>
                  {processing ? <Loader2 size={16} className="animate-spin" /> : t("backup.confirmRestore")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={customModalOpen} onClose={() => !processing && setCustomModalOpen(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-sparkle-text">{t("backup.createCustomTitle")}</h3>

          <div className="p-4 space-y-4">
            <Input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t("backup.enterName")}
              disabled={processing}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setCustomModalOpen(false)}
                disabled={processing}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCustomRestorePoint}
                disabled={processing || !customName.trim()}
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : t("backup.create")}
              </Button>
            </div>
            <p className="text-xs text-center text-sparkle-text-muted">
              {t("backup.mayTakeAWhile")}
            </p>
          </div>
        </div>
      </Modal>
      <Modal open={confirmDeleteAll} onClose={() => !processing && setConfirmDeleteAll(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-sparkle-text">{t("backup.deleteAllTitle")}</h3>
          <div className="p-4 pr-0">
            <p className="text-sparkle-text-secondary mb-4">
              {t("backup.deleteAllDesc", { count: restorePoints.length, plural: restorePoints.length !== 1 ? "s" : "" })}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setConfirmDeleteAll(false)}
                disabled={processing}
              >
                {t("common.cancel")}
              </Button>
              <Button variant="danger" onClick={handleDeleteAll} disabled={processing}>
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  t("backup.deleteAllButton", { count: restorePoints.length })
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function AppliedTweaksTab() {
  const { t } = useTranslation()
  const [tweaks, setTweaks] = useState<Tweak[]>([])
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [undoingTweak, setUndoingTweak] = useState<string | null>(null)
  const [confirmUndoAll, setConfirmUndoAll] = useState(false)
  const [showWhyNotReversible, setShowWhyNotReversible] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedTweaks, savedStates] = await Promise.all([
        invoke({ channel: "tweaks:fetch" }),
        invoke({ channel: "tweak-states:load" }),
      ])
      setTweaks(fetchedTweaks)
      if (savedStates) {
        setToggleStates(JSON.parse(savedStates))
      }
    } catch (error) {
      toast.error("Failed to load applied tweaks.")
      log.error("Failed to load applied tweaks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const appliedTweaks = tweaks.filter((tw) => toggleStates[tw.name])

  const appliedTweakFiltered = appliedTweaks.filter(
    (tw) => tw.reversible === true || tw.reversible === undefined,
  )

  const saveToggleStates = async (newStates: Record<string, boolean>) => {
    await invoke({ channel: "tweak-states:save", payload: JSON.stringify(newStates) })
  }

  const handleUndo = async (tweak: Tweak) => {
    toast.dismiss()
    setUndoingTweak(tweak.name)
    setProcessing(true)
    const loadingToastId =       toast.loading(t("backup.undoingTweak", { name: tweak.title || tweak.name }))
    try {
      const newStates = { ...toggleStates, [tweak.name]: false }
      setToggleStates(newStates)
      await saveToggleStates(newStates)

      const result = await invoke({ channel: "tweak:unapply", payload: tweak.name })
      if (result?.success) {
        toast.update(loadingToastId, {
          render: t("backup.undidTweak", { name: tweak.title || tweak.name }),
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } else {
        toast.update(loadingToastId, {
          render: t("backup.failedUndoTweak", { name: tweak.title || tweak.name }),
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
        const reverted = { ...toggleStates, [tweak.name]: true }
        setToggleStates(reverted)
        await saveToggleStates(reverted)
      }
    } catch (error) {
      log.error(`Error undoing tweak ${tweak.name}:`, error)
      toast.update(loadingToastId, {
        render: t("backup.failedUndoTweak", { name: tweak.title || tweak.name }),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
      const reverted = { ...toggleStates, [tweak.name]: true }
      setToggleStates(reverted)
      await saveToggleStates(reverted)
    }
    setProcessing(false)
    setUndoingTweak(null)
  }

  const handleUndoAll = async () => {
    toast.dismiss()
    setConfirmUndoAll(false)
    setProcessing(true)
    const newStates = { ...toggleStates }
    for (const tweak of appliedTweaks) {
      if (tweak.reversible === false) continue
      const loadingToastId =       toast.loading(t("backup.undoingTweak", { name: tweak.title || tweak.name }))
      try {
        newStates[tweak.name] = false
        setToggleStates({ ...newStates })
        await saveToggleStates(newStates)

        const result = await invoke({ channel: "tweak:unapply", payload: tweak.name })
        if (result?.success) {
          toast.update(loadingToastId, {
            render: t("backup.undidTweak", { name: tweak.title || tweak.name }),
            type: "success",
            isLoading: false,
            autoClose: 3000,
          })
        } else {
          toast.update(loadingToastId, {
            render: t("backup.failedUndoTweak", { name: tweak.title || tweak.name }),
            type: "error",
            isLoading: false,
            autoClose: 3000,
          })
          newStates[tweak.name] = true
          setToggleStates({ ...newStates })
          await saveToggleStates(newStates)
        }
      } catch (error) {
        log.error(`Error undoing tweak ${tweak.name}:`, error)
        toast.update(loadingToastId, {
          render: t("backup.failedUndoTweak", { name: tweak.title || tweak.name }),
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
        newStates[tweak.name] = true
        setToggleStates({ ...newStates })
        await saveToggleStates(newStates)
      } finally {
        toast.dismiss(loadingToastId)
      }
    }
    setProcessing(false)
  }

  return (
    <>
      <div className="h-full max-w-full space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sparkle-text-secondary text-sm">
              {t("backup.appliedTweaksCount", { count: appliedTweaks.length, plural: appliedTweaks.length !== 1 ? "s" : "" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={loadData}
              className="flex items-center gap-2"
              disabled={loading || processing}
            >
              <RotateCw size={16} /> {t("backup.refresh")}
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirmUndoAll(true)}
              disabled={loading || processing || appliedTweakFiltered.length === 0}
              className="flex items-center gap-2"
            >
              <Undo2 size={16} /> {t("backup.undoAllTweaks")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="text-sparkle-primary animate-spin" />
          </div>
        ) : appliedTweaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-sparkle-card border border-sparkle-border rounded-lg">
            <div className="p-4 bg-sparkle-secondary rounded-full mb-4">
              <Wrench size={28} className="text-sparkle-text" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-sparkle-text">{t("backup.noAppliedTweaks")}</h3>
            <p className="text-sparkle-text-secondary max-w-sm mb-4">
              {t("backup.noAppliedTweaksDesc")}
            </p>
          </div>
        ) : (
          <Table className="max-h-96">
            <TableHeader>
              <TableRow>
                <TableHead>{t("backup.tweak")}</TableHead>
                <TableHead className="w-32 text-center">{t("backup.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appliedTweaks.map((tweak) => (
                <TableRow key={tweak.name}>
                  <TableCell>
                    <p className="font-medium">{tweak.title || tweak.name}</p>
                    {tweak.description && (
                      <p className="text-xs text-sparkle-text-secondary mt-0.5">
                        {tweak.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {tweak.reversible !== false ? (
                      <Button
                        variant="outline"
                        className="p-2! gap-2"
                        onClick={() => handleUndo(tweak)}
                        disabled={processing}
                        title={t("backup.undoTweak")}
                      >
                        {undoingTweak === tweak.name ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Undo2 size={16} />
                        )}
                        {t("backup.undoTweak")}
                      </Button>
                    ) : (
                      <span className="text-sparkle-text-secondary text-xs">
                        {t("backup.notReversible")}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
                        )}
                        Undo
                      </Button>
                    ) : (
                      <span className="text-sparkle-text-secondary text-xs">Not reversible</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowWhyNotReversible(true)}
            className="flex items-center gap-2"
          >
            <HelpCircle size={16} /> {t("backup.whyNotReversible")}
          </Button>
        </div>
        {appliedTweaks.length > 0 && (
          <p className="text-center text-amber-600 text-sm">
            {t("backup.undoScriptNote")}
          </p>
        )}
      </div>
      <Modal open={confirmUndoAll} onClose={() => !processing && setConfirmUndoAll(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-sparkle-text">{t("backup.confirmUndoAll")}</h3>
          <div className="p-4 pr-0">
            <p className="text-sparkle-text-secondary mb-4">
              {t("backup.confirmUndoAllDesc", { count: appliedTweakFiltered.length, plural: appliedTweakFiltered.length !== 1 ? "s" : "" })}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setConfirmUndoAll(false)}
                disabled={processing}
              >
                {t("common.cancel")}
              </Button>
              <Button variant="danger" onClick={handleUndoAll} disabled={processing}>
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  t("backup.undoAllButton", { count: appliedTweakFiltered.length })
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal open={showWhyNotReversible} onClose={() => setShowWhyNotReversible(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-lg font-medium text-sparkle-text mb-4">
            {t("backup.whyNotReversible")}
          </h3>
          <div className="text-sparkle-text-secondary text-sm leading-6 space-y-3">
            <p>
              {t("backup.whyNotReversibleDesc1")}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-sparkle-text">{t("backup.debloatingWindows")}</strong> {t("backup.debloatingWindowsDesc")}
              </li>
              <li>
                <strong className="text-sparkle-text">{t("backup.optimizeNvidia")}</strong> {t("backup.optimizeNvidiaDesc")}
              </li>
              <li>
                <strong className="text-sparkle-text">{t("backup.serviceMods")}</strong> {t("backup.serviceModsDesc")}
              </li>
            </ul>
            <p>
              {t("backup.whyNotReversibleDesc2")}
            </p>
            <p className="text-orange-400 text-xs">
              {t("backup.tipNonReversible")}
            </p>
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={() => setShowWhyNotReversible(false)}>
              {t("common.gotIt")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default function RestorePointManager() {
  const [activeTab, setActiveTab] = useState<"restore" | "history">("restore")

  return (
    <RootDiv>
      <div className="h-full max-w-full space-y-4 overflow-hidden">
        <div className="flex gap-1 bg-sparkle-card border border-sparkle-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 ${
              activeTab === "restore"
                ? "bg-sparkle-primary text-white shadow"
                : "text-sparkle-text-secondary hover:text-sparkle-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield size={16} />
              Restore Points
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 ${
              activeTab === "history"
                ? "bg-sparkle-primary text-white shadow"
                : "text-sparkle-text-secondary hover:text-sparkle-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <Wrench size={16} />
              Revert Applied Tweaks (NEW)
            </span>
          </button>
        </div>

        {activeTab === "restore" ? <RestorePointsTab /> : <AppliedTweaksTab />}
      </div>
    </RootDiv>
  )
}
