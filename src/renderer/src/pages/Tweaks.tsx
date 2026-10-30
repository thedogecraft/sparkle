import { useState, useEffect, useMemo } from "react"
import {
  Wrench,
  Search,
  AlertTriangle,
  Monitor,
  Shield,
  Gamepad,
  Network,
  Zap,
  Paintbrush,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "react-toastify"
import RootDiv from "@/components/rootdiv"
import Tooltip from "@/components/ui/tooltip"
import Modal from "@/components/ui/modal"
import { invoke } from "@/lib/electron"
import useRestartStore from "@/store/restartState"
import useSystemStore from "@/store/systemInfo"
import Button from "@/components/ui/button"
import Toggle from "@/components/ui/Toggle"
import Checkbox from "@/components/ui/Checkbox"
import log from "electron-log/renderer"
import Card from "@/components/ui/Card"
import { Gpu, Plus, RotateCw } from "lucide-react"
import { LargeInput } from "@/components/ui/input"
import { isNewInCurrentVersion, isUpdatedInCurrentVersion, CURRENT_VERSION } from "@/lib/version"
import { Star } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Tweak } from "@/types/index"

function Tweaks() {
  const [tweaks, setTweaks] = useState<Tweak[]>([])
  const [toggleStates, setToggleStates] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [modalContent, setModalContent] = useState<string | boolean | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTweak, setSelectedTweak] = useState<Tweak | null>(null)
  const [isRecommendedModalOpen, setIsRecommendedModalOpen] = useState(false)
  const [recommendedTweaksToApply, setRecommendedTweaksToApply] = useState<Tweak[]>([])
  const [selectedRecommendedTweaks, setSelectedRecommendedTweaks] = useState<Set<string>>(new Set())
  const [isApplyingRecommended, setIsApplyingRecommended] = useState(false)
  const [isAltHeld, setIsAltHeld] = useState(false)

  const { setNeedsRestart } = useRestartStore()
  const systemInfo = useSystemStore((state) => state.systemInfo)

  const isTweakCompatible = (tweak) => {
    if (!systemInfo || Object.keys(systemInfo).length === 0) {
      return { compatible: true }
    }

    if (tweak.category && tweak.category.includes("GPU")) {
      if (!systemInfo.hasGPU) {
        return { compatible: false, reason: "Requires a dedicated GPU" }
      }
    }

    if (tweak.name === "optimize-nvidia-settings") {
      if (!systemInfo.isNvidia) {
        return { compatible: false, reason: "Requires an NVIDIA GPU" }
      }
    }

    return { compatible: true }
  }

  useEffect(() => {
    loadTweaks()
    loadToggleStates()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) setIsAltHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) setIsAltHeld(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const loadTweaks = async () => {
    try {
      const fetchedTweaks = await invoke({
        channel: "tweaks:fetch",
      })
      setTweaks(fetchedTweaks)
    } catch (error) {
      console.error("Error fetching tweaks:", error)
      log.error("Error fetching tweaks:", error)
    }
  }

  const loadToggleStates = async () => {
    try {
      const savedStates = await invoke({
        channel: "tweak-states:load",
      })

      if (savedStates) {
        setToggleStates(JSON.parse(savedStates))
      }
    } catch (error) {
      console.error("Error loading toggle states:", error)
      log.error("Error loading toggle states:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveToggleStates = async (newStates) => {
    try {
      await invoke({
        channel: "tweak-states:save",
        payload: JSON.stringify(newStates),
      })
    } catch (error) {
      console.error("Error saving toggle states:", error)
      log.error("Error saving toggle states:", error)
    }
  }

  const applyTweak = async (tweak, _) => {
    toast.dismiss()
    const newState = !toggleStates[tweak.name]
    const newStates = {
      ...toggleStates,
      [tweak.name]: newState,
    }

    setToggleStates(newStates)

    const loadingToastId = toast.loading(
      `${newState ? "Applying" : "Unapplying"} tweak: ${tweak.title}`,
    )

    try {
      await saveToggleStates(newStates)

      if (newState) {
        const result = await invoke({
          channel: "tweak:apply",
          payload: tweak.name,
        })
        if (result?.success === false) {
          throw new Error(result.error || `Failed to apply tweak: ${tweak.title}`)
        }
        if (tweak.restart) {
          setNeedsRestart(true)
        }
        toast.update(loadingToastId, {
          render: `Applied tweak: ${tweak.title}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } else {
        const result = await invoke({
          channel: "tweak:unapply",
          payload: tweak.name,
        })
        if (result?.success === false) {
          throw new Error(result.error || `Failed to unapply tweak: ${tweak.title}`)
        }
        if (tweak.restart) {
          setNeedsRestart(true)
        }
        toast.update(loadingToastId, {
          render: `Unapplied tweak: ${tweak.title}`,
          type: "info",
          isLoading: false,
          autoClose: 3000,
        })
      }
    } catch (error) {
      console.error(`Error toggling tweak ${tweak.title}:`, error)
      log.error(`Error toggling tweak ${tweak.title}:`, error)

      toast.update(loadingToastId, {
        render: `Failed to ${newState ? "apply" : "unapply"} tweak: ${tweak.title}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })

      const revertedStates = {
        ...newStates,
        [tweak.name]: !newState,
      }

      setToggleStates(revertedStates)

      try {
        await saveToggleStates(revertedStates)
      } catch (err) {
        console.error("Error reverting toggle state:", err)
        log.error("Error reverting toggle state:", err)
      }
    }
  }

  const applyNonReversibleTweak = async (tweak, _) => {
    toast.dismiss()
    const newStates = {
      ...toggleStates,
      [tweak.name]: true,
    }

    setToggleStates(newStates)

    const loadingToastId = toast.loading(`Applying tweak: ${tweak.title}`)

    try {
      await saveToggleStates(newStates)
      const result = await invoke({
        channel: "tweak:apply",
        payload: tweak.name,
      })
      if (result?.success === false) {
        throw new Error(result.error || `Failed to apply tweak: ${tweak.title}`)
      }
      if (tweak.restart) {
        setNeedsRestart(true)
      }
      toast.update(loadingToastId, {
        render: `Applied tweak: ${tweak.title}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error) {
      console.error(`Error applying tweak ${tweak.title}:`, error)
      log.error(`Error applying tweak ${tweak.title}:`, error)

      const revertedStates = {
        ...toggleStates,
        [tweak.name]: toggleStates[tweak.name],
      }
      setToggleStates(revertedStates)

      try {
        await saveToggleStates(revertedStates)
      } catch (err) {
        console.error("Error reverting toggle state:", err)
        log.error("Error reverting toggle state:", err)
      }

      toast.update(loadingToastId, {
        render: `Failed to apply tweak: ${tweak.title}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }

  const handleToggle = async (index) => {
    const tweak: any = tweaks[index]

    if (tweak.modal && !toggleStates[tweak.name]) {
      setSelectedTweak(tweak)
      setModalContent(tweak.modal)
      setIsModalOpen(true)
      return
    }

    await applyTweak(tweak, index)
  }

  const handleButtonClick = async (index) => {
    const tweak: Tweak = tweaks[index]

    if (tweak.modal) {
      setSelectedTweak(tweak)
      setModalContent(tweak.modal)
      setIsModalOpen(true)
      return
    }

    await applyNonReversibleTweak(tweak, index)
  }

  const forceReapplyTweak = async (tweak: Tweak) => {
    toast.dismiss()
    const loadingToastId = toast.loading(`Reapplying tweak: ${tweak.title}`)

    try {
      const result = await invoke({
        channel: "tweak:apply",
        payload: tweak.name,
      })
      if (result?.success === false) {
        throw new Error(result.error || `Failed to reapply tweak: ${tweak.title}`)
      }
      if (tweak.restart) {
        setNeedsRestart(true)
      }
      toast.update(loadingToastId, {
        render: `Reapplied tweak: ${tweak.title}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error) {
      console.error(`Error reapplying tweak ${tweak.title}:`, error)
      log.error(`Error reapplying tweak ${tweak.title}:`, error)
      toast.update(loadingToastId, {
        render: `Failed to reapply tweak: ${tweak.title}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }

  const handleApplyRecommended = async () => {
    const preset = presets[0]
    const presetTweaks = tweaks.filter((t) => preset.tweaks.includes(t.name))
    setRecommendedTweaksToApply(presetTweaks)
    setSelectedRecommendedTweaks(new Set(presetTweaks.map((t) => t.name)))
    setIsRecommendedModalOpen(true)
  }

  const applyRecommendedTweaks = async () => {
    toast.dismiss()
    setIsApplyingRecommended(true)
    setIsRecommendedModalOpen(false)

    const newStates = { ...toggleStates }
    const tweaksToApply = recommendedTweaksToApply.filter((t) =>
      selectedRecommendedTweaks.has(t.name),
    )

    for (const tweak of tweaksToApply) {
      const loadingToastId = toast.loading(`Applying tweak: ${tweak.title}`)

      try {
        newStates[tweak.name] = true
        setToggleStates({ ...newStates })
        await saveToggleStates(newStates)

        const result = await invoke({
          channel: "tweak:apply",
          payload: tweak.name,
        })
        if (result?.success === false) {
          throw new Error(result.error || `Failed to apply tweak: ${tweak.title}`)
        }

        if (tweak.restart) {
          setNeedsRestart(true)
        }

        toast.update(loadingToastId, {
          render: `Applied tweak: ${tweak.title}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } catch (error) {
        console.error(`Error applying tweak ${tweak.title}:`, error)
        log.error(`Error applying tweak ${tweak.title}:`, error)

        newStates[tweak.name] = false
        setToggleStates({ ...newStates })
        await saveToggleStates(newStates)

        toast.update(loadingToastId, {
          render: `Failed to apply tweak: ${tweak.title}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
      }
    }

    setIsApplyingRecommended(false)
  }

  const categories = useMemo(
    () => ["All", ...new Set(tweaks.flatMap((t: any) => t.category || []).filter(Boolean))],
    [tweaks],
  )

  const filteredTweaks: any = useMemo(() => {
    return tweaks.filter((tweak) => {
      const matchesSearch =
        tweak.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tweak.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        activeCategory === "All" ||
        (Array.isArray(tweak.category) && tweak.category.includes(activeCategory)) ||
        tweak.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [tweaks, searchTerm, activeCategory])

  // sort this so recommended tweaks are at the top
  const sortedTweaks = useMemo(() => {
    return [...filteredTweaks].sort((a, b) => {
      const aRec: any = !!a.top
      const bRec: any = !!b.top
      return bRec - aRec
    })
  }, [filteredTweaks])

  const categoryIcons = {
    Performance: <Zap className="w-4 h-4  text-yellow-500" />,
    GPU: <Gpu className="w-4 h-4 text-red-500" />,
    Privacy: <Shield className="w-4 h-4 text-green-500" />,
    Network: <Network className="w-4 h-4 text-orange-500" />,
    Appearance: <Paintbrush className="w-4 h-4 text-sparkle-primary" />,
    Gaming: <Gamepad className="w-4 h-4 text-teal-500" />,
    General: <Wrench className="w-4 h-4 text-blue-500" />,
    AI: <Sparkles className="w-4 h-4 text-purple-500" />,
  }

  const presets = [
    {
      name: "Apply Recommended Tweaks",
      description: "A balanced set of tweaks for everyday use.",
      tweaks: [
        "disable-telemetry",
        "revert-context-menu",
        "hide-taskview-and-widgets",
        "set-win32-priority-separation",
        "disable-copilot",
        "enable-end-task-right-click",
        "disable-location-tracking",
        "disable-lockscreen-tips",
        "optimize-network-settings",
        "set-services-to-manual",
        "wpbt",
      ],
    },
  ]

  if (isLoading) {
    return (
      <RootDiv>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading tweaks...</div>
        </div>
      </RootDiv>
    )
  }

  return (
    <>
      <Modal open={isRecommendedModalOpen} onClose={() => setIsRecommendedModalOpen(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 max-w-xl w-full mx-4 max-h-2xl">
          <h3 className="text-xl font-semibold text-sparkle-text mb-3">Apply Recommended Tweaks</h3>
          <div className="text-sparkle-text-secondary text-sm leading-6 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar mb-6">
            Select the tweaks you want to apply:
            <p className="text-xs text-orange-500 ">
              Debloating windows is highly recommended. you can do it after you apply the recomended
              tweaks. its not here because it has a UI
            </p>
            <ul className="mt-3 space-y-3">
              {recommendedTweaksToApply.map((tweak) => (
                <li
                  key={tweak.name}
                  className="flex flex-col rounded-lg border border-sparkle-border p-3 mr-2"
                >
                  <label className="flex items-center cursor-pointer">
                    <Checkbox
                      checked={selectedRecommendedTweaks.has(tweak.name)}
                      onChange={(checked) => {
                        const newSelected = new Set(selectedRecommendedTweaks)
                        if (checked) newSelected.add(tweak.name)
                        else newSelected.delete(tweak.name)
                        setSelectedRecommendedTweaks(newSelected)
                      }}
                    />
                    <h2 className="font-medium text-sparkle-text">{tweak.title}</h2>
                  </label>

                  {tweak.description && (
                    <p className="ml-7 text-sm text-sparkle-text-secondary leading-snug">
                      {tweak.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsRecommendedModalOpen(false)}
              disabled={isApplyingRecommended}
            >
              Cancel
            </Button>
            <Button
              onClick={applyRecommendedTweaks}
              disabled={isApplyingRecommended || selectedRecommendedTweaks.size === 0}
            >
              {isApplyingRecommended
                ? "Applying..."
                : `Apply Selected (${selectedRecommendedTweaks.size})`}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
      >
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-xl font-semibold text-sparkle-text mb-3">{selectedTweak?.title}</h3>
          <div className="text-sparkle-text-secondary text-sm leading-6 max-h-64 overflow-y-auto custom-scrollbar mb-6 prose prose-green marker:text-sparkle-secondary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(modalContent)}</ReactMarkdown>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
              }}
            >
              Cancel
            </Button>
            {selectedTweak && (
              <Button
                onClick={async () => {
                  const newState = true
                  const newStates = {
                    ...toggleStates,
                    [selectedTweak.name]: newState,
                  }

                  setToggleStates(newStates)
                  setIsModalOpen(false)

                  const loadingToastId = toast.loading(`Applying tweak: ${selectedTweak.title}`)

                  try {
                    await saveToggleStates(newStates)
                    const result = await invoke({
                      channel: "tweak:apply",
                      payload: selectedTweak.name,
                    })
                    if (result?.success === false) {
                      throw new Error(
                        result.error || `Failed to apply tweak: ${selectedTweak.title}`,
                      )
                    }
                    if (selectedTweak.restart) {
                      setNeedsRestart(true)
                    }
                    toast.update(loadingToastId, {
                      render: `Applied tweak: ${selectedTweak.title}`,
                      type: "success",
                      isLoading: false,
                      autoClose: 3000,
                    })
                  } catch (error) {
                    console.error(`Error applying tweak ${selectedTweak.title}:`, error)
                    log.error(`Error applying tweak ${selectedTweak.title}:`, error)

                    const revertedStates = {
                      ...toggleStates,
                      [selectedTweak.name]: false,
                    }
                    setToggleStates(revertedStates)
                    await saveToggleStates(revertedStates)

                    toast.update(loadingToastId, {
                      render: `Failed to apply tweak: ${selectedTweak.title}`,
                      type: "error",
                      isLoading: false,
                      autoClose: 3000,
                    })
                  }
                }}
              >
                Apply
              </Button>
            )}
          </div>
        </div>
      </Modal>
      <RootDiv>
        <div className="max-w-450 mx-auto ">
          <div className="mb-4">
            <div className="space-y-4">
              <LargeInput
                icon={Search}
                placeholder="Search tweaks by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 flex gap-2 items-center  ${
                      activeCategory === category
                        ? "dark:bg-sparkle-accent bg-sparkle-text-muted text-sparkle-text shadow-lg border border-sparkle-border"
                        : "bg-sparkle-card/50 text-sparkle-text-secondary  hover:bg-sparkle-border border border-sparkle-border-secondary"
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {categoryIcons[category]} {category}
                  </button>
                ))}
              </div>
              <div className="flex gap-5 items-center">
                {presets.length > 0 && tweaks.some((t) => presets[0].tweaks.includes(t.name)) && (
                  <Button
                    variant="secondary"
                    onClick={handleApplyRecommended}
                    disabled={isApplyingRecommended}
                  >
                    Apply Recommended Tweaks
                  </Button>
                )}
                <p className="text-sm text-sparkle-text-muted">
                  Tip: Hold{" "}
                  <kbd className="p-1 pt-0.5 pb-0.5 rounded-lg bg-sparkle-border">Alt</kbd> and
                  click "Reapply" to force reapply it.
                </p>
                <p className="text-xs text-sparkle-text-secondary ml-auto mr-2">
                  Showing {sortedTweaks.length} of {tweaks.length} tweaks
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {sortedTweaks.length > 0 ? (
              sortedTweaks.map((tweak, _) => {
                const originalIndex = tweaks.indexOf(tweak)
                const cardBody = (
                  <div className="p-5 flex flex-col h-65">
                    <div className="flex items-center justify-between mb-3">
                      {tweak.category && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <>
                            {tweak.warning && (
                              <Tooltip content={tweak.warning} delay={0.3} side="right">
                                <div className="p-1.5 dark:bg-red-900/50 bg-red-300 rounded-lg hover:bg-red-800 dark:hover:bg-red-900/80 transition-colors">
                                  <AlertTriangle className="w-4 h-4 dark:text-red-400 text-red-600 hover:text-white" />
                                </div>
                              </Tooltip>
                            )}
                            {tweak.recommended && (
                              <Tooltip content={"Recommended Tweak"} delay={0.3} side="right">
                                <div className="p-1.5 bg-green-500/50 rounded-lg hover:bg-green-500/80 transition-colors">
                                  <Star className="w-4 h-4 text-white fill-white" />
                                </div>
                              </Tooltip>
                            )}
                            {tweak.addedversion &&
                              isNewInCurrentVersion(tweak.addedversion, CURRENT_VERSION) && (
                                <Tooltip
                                  content={`New in Sparkle ${tweak.addedversion}`}
                                  delay={0.3}
                                  side="right"
                                >
                                  <div className="p-1.5 bg-pink-500/50 rounded-lg hover:bg-pink-500/80 transition-colors">
                                    <Plus className="w-4 h-4 text-white" />
                                  </div>
                                </Tooltip>
                              )}
                            {tweak.updatedversion &&
                              isUpdatedInCurrentVersion(tweak.updatedversion, CURRENT_VERSION) && (
                                <Tooltip
                                  content={`Updated in Sparkle ${tweak.updatedversion}`}
                                  delay={0.3}
                                  side="right"
                                >
                                  <div className="p-1.5 bg-blue-500/50 rounded-lg hover:bg-blue-500/80 transition-colors">
                                    <RotateCw className="w-4 h-4 text-white" />
                                  </div>
                                </Tooltip>
                              )}
                            {(Array.isArray(tweak.category)
                              ? tweak.category
                              : [tweak.category]
                            ).map((cat) => (
                              <Tooltip
                                key={cat}
                                content={`${cat} Optimization`}
                                delay={0.3}
                                side="right"
                              >
                                <div className="p-1.5 bg-sparkle-accent rounded-lg hover:bg-sparkle-bg transition-colors text-sparkle-text">
                                  {categoryIcons[cat] || categoryIcons["General"]}
                                </div>
                              </Tooltip>
                            ))}
                            {tweak.risk && (
                              <Tooltip
                                content={tweak.risk === "safe" ? "Safe to use" : "Use with caution"}
                                delay={0.3}
                                side="right"
                              >
                                <div className="p-1.5 bg-sparkle-accent rounded-lg hover:bg-sparkle-bg transition-colors text-sparkle-text">
                                  {tweak.risk === "safe" && (
                                    <div className="flex gap-2">
                                      <ShieldCheck className="w-4 h-4 text-green-500" />{" "}
                                      <p className="text-xs">Safe</p>
                                    </div>
                                  )}
                                  {tweak.risk === "risky" && (
                                    <div className="flex gap-2">
                                      <AlertTriangle className="w-4 h-4 text-red-500" />{" "}
                                      <p className="text-xs">Risky</p>
                                    </div>
                                  )}
                                  {tweak.risk === "caution" && (
                                    <div className="flex gap-2">
                                      <AlertTriangle className="w-4 h-4 text-yellow-500" />{" "}
                                      <p className="text-xs">Caution</p>
                                    </div>
                                  )}
                                </div>
                              </Tooltip>
                            )}
                          </>
                        </div>
                      )}

                      <div className="flex items-center m-0 gap-2">
                        <Button
                          variant="secondary"
                          className="px-2! py-1! text-xs flex items-center gap-1"
                          title="Open Docs"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            const url = `https://docs.getsparkle.net/tweaks/${tweak.name}`
                            window.open(url, "_blank")
                          }}
                        >
                          <ExternalLink className="w-3 h-3" /> Docs
                        </Button>

                        {(() => {
                          const compatibility = isTweakCompatible(tweak)
                          return (
                            <>
                              {!compatibility.compatible && (
                                <Tooltip content={compatibility.reason} delay={0.3} side="right">
                                  <div className="p-1.5 bg-orange-500/50 rounded-lg hover:bg-orange-500/80 transition-colors">
                                    <Monitor className="w-4 h-4 text-orange-300" />
                                  </div>
                                </Tooltip>
                              )}
                              {tweak.reversible == null || tweak.reversible == true ? (
                                toggleStates[tweak.name] && isAltHeld ? (
                                  <Tooltip
                                    content={
                                      !compatibility.compatible
                                        ? compatibility.reason
                                        : "Force reapply"
                                    }
                                  >
                                    <Button
                                      variant="outline"
                                      className="px-2! py-1! text-xs flex items-center gap-1"
                                      onClick={() => forceReapplyTweak(tweak)}
                                      disabled={!compatibility.compatible}
                                    >
                                      <RotateCw className="w-3 h-3" /> Reapply
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  <Tooltip
                                    content={
                                      !compatibility.compatible ? compatibility.reason : null
                                    }
                                  >
                                    <Toggle
                                      checked={toggleStates[tweak.name] || false}
                                      onChange={() => handleToggle(originalIndex)}
                                      disabled={!compatibility.compatible}
                                    />
                                  </Tooltip>
                                )
                              ) : (
                                <Tooltip
                                  content={!compatibility.compatible ? compatibility.reason : null}
                                >
                                  <Button
                                    onClick={() => handleButtonClick(originalIndex)}
                                    disabled={!compatibility.compatible}
                                  >
                                    Apply
                                  </Button>
                                </Tooltip>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex items-start mb-3">
                      <h2 className="font-semibold text-sparkle-text text-base">{tweak.title}</h2>
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <p className="text-sparkle-text-secondary text-sm flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {tweak.description}
                      </p>
                    </div>
                  </div>
                )
                return tweak.name === "debloat-windows" ? (
                  <div
                    key={originalIndex}
                    className="animate-border-spin rounded-xl p-[1px]"
                    style={{
                      background:
                        "conic-gradient(from var(--angle), #3b82f6, #22c55e, #eab308, #f97316, #ec4899, #8b5cf6, #3b82f6)",
                    }}
                  >
                    <Card className="border-0 p-0 h-52">{cardBody}</Card>
                  </div>
                ) : (
                  <Card key={originalIndex} className=" p-0 h-52">
                    {cardBody}
                  </Card>
                )
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-sparkle-card p-6 rounded-2xl mb-4">
                  <Search className="w-10 h-10 text-sparkle-text-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-sparkle-text"> Loading Tweaks...</h3>
                <h3 className="text-sm font-medium mb-2 text-sparkle-text-muted">
                  No tweaks Found
                </h3>
                <p className="text-sparkle-text-secondary">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </RootDiv>
    </>
  )
}

export default Tweaks
