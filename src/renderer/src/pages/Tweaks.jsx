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
import log from "electron-log/renderer"
import posthog from "posthog-js"
import Card from "@/components/ui/Card"
import { Gpu, Plus, RefreshCw } from "lucide-react"
import { LargeInput } from "@/components/ui/input"
import { isNewInCurrentVersion, isUpdatedInCurrentVersion, CURRENT_VERSION } from "@/lib/version"
import { Star } from "lucide-react"

/**
 * Render and manage the UI for available system tweaks, including search, category filtering,
 * compatibility checks, and applying or unapplying tweaks.
 *
 * The component loads tweak definitions and persisted toggle states from IPC, maintains local
 * UI state (search, category, modal, toggle map), persists toggle changes back to IPC, and
 * invokes tweak apply/unapply actions. It will flag a required restart when a tweak indicates
 * a restart is necessary and surfaces user feedback via toasts and a confirmation modal when
 * a tweak provides modal instructions.
 *
 * @returns {JSX.Element} A React element representing the tweaks management UI.
 */
function Tweaks() {
  const [tweaks, setTweaks] = useState([])
  const [toggleStates, setToggleStates] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [modalContent, setModalContent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTweak, setSelectedTweak] = useState(null)

  const { setNeedsRestart } = useRestartStore()
  const systemInfo = useSystemStore((state) => state.systemInfo)

  const isTweakCompatible = (tweak) => {
    // If system info is not loaded yet, assume compatible to avoid false negatives
    if (!systemInfo || Object.keys(systemInfo).length === 0) {
      return { compatible: true }
    }

    // Check if tweak requires GPU
    if (tweak.category && tweak.category.includes("GPU")) {
      if (!systemInfo.hasGPU) {
        return { compatible: false, reason: "Requires a dedicated GPU" }
      }
    }

    // Check if tweak requires NVIDIA GPU
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

  const applyTweak = async (tweak, index) => {
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
        await invoke({
          channel: "tweak:apply",
          payload: tweak.name,
        })
        if (tweak.restart) {
          setNeedsRestart(true)
        }
        toast.update(loadingToastId, {
          render: `Applied tweak: ${tweak.title}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
        posthog.capture("tweak_applied", {
          tweak_name: tweak.name,
        })
      } else {
        await invoke({
          channel: "tweak:unapply",
          payload: tweak.name,
        })
        if (tweak.restart) {
          setNeedsRestart(true)
        }
        toast.update(loadingToastId, {
          render: `Unapplied tweak: ${tweak.title}`,
          type: "info",
          isLoading: false,
          autoClose: 3000,
        })
        posthog.capture("tweak_unapplied", {
          tweak_name: tweak.name,
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

  const applyNonReversibleTweak = async (tweak, index) => {
    const newStates = {
      ...toggleStates,
      [tweak.name]: true,
    }

    setToggleStates(newStates)

    const loadingToastId = toast.loading(`Applying tweak: ${tweak.title}`)

    try {
      await saveToggleStates(newStates)
      await invoke({
        channel: "tweak:apply",
        payload: tweak.name,
      })
      if (tweak.restart) {
        setNeedsRestart(true)
      }
      toast.update(loadingToastId, {
        render: `Applied tweak: ${tweak.title}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
      posthog.capture("tweak_applied", {
        tweak_name: tweak.name,
      })
    } catch (error) {
      console.error(`Error applying tweak ${tweak.title}:`, error)
      log.error(`Error applying tweak ${tweak.title}:`, error)
      toast.update(loadingToastId, {
        render: `Failed to apply tweak: ${tweak.title}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }

  const handleToggle = async (index) => {
    const tweak = tweaks[index]

    if (tweak.modal && !toggleStates[tweak.name]) {
      setSelectedTweak(tweak)
      setModalContent(tweak.modal)
      setIsModalOpen(true)
      return
    }

    await applyTweak(tweak, index)
  }

  const handleButtonClick = async (index) => {
    const tweak = tweaks[index]

    if (tweak.modal) {
      setSelectedTweak(tweak)
      setModalContent(tweak.modal)
      setIsModalOpen(true)
      return
    }

    await applyNonReversibleTweak(tweak, index)
  }

  const categories = useMemo(
    () => ["All", ...new Set(tweaks.flatMap((t) => t.category || []).filter(Boolean))],
    [tweaks],
  )

  const filteredTweaks = useMemo(() => {
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
      const aRec = !!a.top
      const bRec = !!b.top
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
  }

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
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
      >
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-6 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-xl font-semibold text-sparkle-text mb-3">{selectedTweak?.title}</h3>
          <div className="text-sparkle-text-secondary text-sm leading-6 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar mb-6">
            {modalContent}
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
            <Button
              onClick={async () => {
                const index = tweaks.indexOf(selectedTweak)
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
                  await invoke({
                    channel: "tweak:apply",
                    payload: selectedTweak.name,
                  })
                  if (selectedTweak.restart) {
                    setNeedsRestart(true)
                  }
                  toast.update(loadingToastId, {
                    render: `Applied tweak: ${selectedTweak.title}`,
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                  })
                  posthog.capture("tweak_applied", {
                    tweak_name: selectedTweak.name,
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
                }
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>
      <RootDiv>
        <div className="max-w-[1800px] mx-auto ">
          <div className="mb-4">
            <div className="space-y-4">
              <LargeInput
                type="text"
                icon={Search}
                placeholder="Search tweaks by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95  ${activeCategory === category
                        ? "bg-sparkle-primary text-white shadow-lg border border-sparkle-border"
                        : "bg-sparkle-card/50 text-sparkle-text-secondary  hover:bg-sparkle-border border border-sparkle-border-secondary"
                      }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {sortedTweaks.length > 0 ? (
              sortedTweaks.map((tweak, index) => {
                const originalIndex = tweaks.indexOf(tweak)
                return (
                  <Card key={originalIndex} className=" p-0 h-44">
                    <div className="p-4 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        {tweak.category && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <>
                              {tweak.warning && (
                                <Tooltip content={tweak.warning} delay={0.3} side="right">
                                  <div className="p-1.5 bg-red-900/50 rounded-lg hover:bg-red-900/80 transition-colors">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
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
                                isUpdatedInCurrentVersion(
                                  tweak.updatedversion,
                                  CURRENT_VERSION,
                                ) && (
                                  <Tooltip
                                    content={`Updated in Sparkle ${tweak.updatedversion}`}
                                    delay={0.3}
                                    side="right"
                                  >
                                    <div className="p-1.5 bg-blue-500/50 rounded-lg hover:bg-blue-500/80 transition-colors">
                                      <RefreshCw className="w-4 h-4 text-white" />
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
                                  <Tooltip
                                    content={
                                      !compatibility.compatible ? compatibility.reason : null
                                    }
                                  >
                                    <Toggle
                                      checked={toggleStates[tweak.name] || false}
                                      onChange={(e) => {
                                        const willOpenModal =
                                          !!tweak.modal && !toggleStates[tweak.name]
                                        if (willOpenModal) {
                                          e.preventDefault()
                                          e.stopPropagation()
                                        }
                                        handleToggle(originalIndex)
                                      }}
                                      disabled={!compatibility.compatible}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip
                                    content={
                                      !compatibility.compatible ? compatibility.reason : null
                                    }
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