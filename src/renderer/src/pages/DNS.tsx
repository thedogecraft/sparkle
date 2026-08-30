import { useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import { Globe, Shield, Settings, RotateCw, AlertCircle, Info, LoaderCircle } from "lucide-react"
import { Cloud } from "lucide-react"
import log from "electron-log/renderer"
import { Check, X } from "lucide-react"
import Card from "@/components/ui/Card"
import { useTranslation } from "react-i18next"

interface PingResult {
  name: string
  server: string
  latency: number | null
  status: "success" | "timeout" | "error"
}

interface DNSProvider {
  id: string
  name: string
  primary: string
  secondary: string
  description: string
  features: string[]
  recommended?: boolean
  color: string
  icon: React.ReactElement
}

const dnsProviders = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    primary: "1.1.1.1",
    secondary: "1.0.0.1",
    description: "Fast, secure, and privacy-focused DNS",
    features: ["Fast", "Privacy-focused", "Security"],
    recommended: true,
    color: "text-orange-500",
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    id: "google",
    name: "Google",
    primary: "8.8.8.8",
    secondary: "8.8.4.4",
    description: "Reliable and widely used DNS service",
    features: ["Reliable", "Fast", "Widely supported"],
    color: "text-blue-500",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: "opendns",
    name: "OpenDNS",
    primary: "208.67.222.222",
    secondary: "208.67.220.220",
    description: "Cisco-owned DNS with content filtering",
    features: ["Content filtering", "Reliable", "Security"],
    color: "text-green-500",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "quad9",
    name: "Quad9",
    primary: "9.9.9.9",
    secondary: "149.112.112.112",
    description: "Security-focused DNS with threat blocking",
    features: ["Security", "Threat blocking", "Privacy"],
    color: "text-purple-500",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "adguard",
    name: "AdGuard DNS",
    primary: "94.140.14.14",
    secondary: "94.140.15.15",
    description: "Blocks ads, trackers, malware",
    features: ["Security", "Threat blocking", "Privacy"],
    color: "text-teal-500",
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    id: "automatic",
    name: "Automatic (DHCP)",
    primary: "Auto",
    secondary: "Auto",
    description: "Use your ISP's default DNS servers",
    features: ["Default", "ISP provided", "No configuration"],
    color: "text-gray-500",
    icon: <Settings className="w-5 h-5" />,
  },
]

export default function DNSPage() {
  const { t } = useTranslation()
  const [selectedProvider, setSelectedProvider] = useState<DNSProvider | null>(null)
  const [currentDNS, setCurrentDNS] = useState<Array<{ adapter: string; servers: string }> | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [customDNS, setCustomDNS] = useState({ primary: "", secondary: "" })
  const [showCustom, setShowCustom] = useState(false)
  const [pingResults, setPingResults] = useState<PingResult[] | null>(null)
  const [pingLoading, setPingLoading] = useState(false)

  useEffect(() => {
    getCurrentDNS()
  }, [])

  const getCurrentDNS = async () => {
    try {
      const result = await invoke({
        channel: "dns:get-current",
      })

      if (result.success) {
        setCurrentDNS(result.data)
      }
    } catch (error) {
      console.error("Error getting current DNS:", error)
      log.error("Error getting current DNS:", error)
    }
  }

  const applyDNS = async (provider) => {
    toast.dismiss()
    setLoading(true)
    const toastId = toast.loading(t("dns.applyingDNS", { name: provider.name }))

    try {
      let payload
      if (provider.id === "custom") {
        payload = {
          dnsType: "custom",
          primaryDNS: customDNS.primary,
          secondaryDNS: customDNS.secondary,
        }
      } else {
        payload = {
          dnsType: provider.id,
        }
      }

      const result = await invoke({
        channel: "dns:apply",
        payload,
      })

      if (result.success) {
        toast.update(toastId, {
          render: t("dns.dnsApplied", { name: provider.name }),
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
        await getCurrentDNS()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast.update(toastId, {
        render: t("dns.failedApplyDNS", { error: error.message }),
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      log.error("Failed to apply DNS:", error)
    } finally {
      setLoading(false)
      setModalOpen(false)
    }
  }

  const openConfirmationModal = (provider) => {
    setSelectedProvider(provider)
    setModalOpen(true)
  }

  const validateCustomDNS = (dns) => {
    // regex is weird
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(dns)
  }

  const isCustomDNSValid = () => {
    return (
      customDNS.primary &&
      validateCustomDNS(customDNS.primary) &&
      (!customDNS.secondary || validateCustomDNS(customDNS.secondary))
    )
  }

  const testAllPing = async () => {
    setPingLoading(true)
    setPingResults(null)

    try {
      const result = await invoke({
        channel: "dns:ping-all",
      })

      if (result.success) {
        const sorted = [...result.data].sort((a, b) => {
          if (a.latency === null && b.latency === null) return 0
          if (a.latency === null) return 1
          if (b.latency === null) return -1
          return a.latency - b.latency
        })
        setPingResults(sorted)
      } else {
        toast.error(t("dns.pingFailed", { error: result.error }))
      }
    } catch (error: any) {
      toast.error(t("dns.pingFailed", { error: error.message }))
      log.error("Failed to ping DNS servers:", error)
    } finally {
      setPingLoading(false)
    }
  }

  const getLowestPingServer = () => {
    if (!pingResults) return null
    const successResults = pingResults.filter((r) => r.latency !== null)
    return successResults.length > 0 ? successResults[0] : null
  }

  return (
    <>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-sparkle-card p-4 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
          <h2 className="text-lg font-semibold mb-4">{t("dns.confirmChange")}</h2>
          {selectedProvider && (
            <>
              <p className="mb-4">
                {t("dns.changeTo", { name: selectedProvider.name })}
              </p>
              <div className="bg-sparkle-border-secondary border border-sparkle-border p-3 rounded-md mb-4">
                <div className="text-sm">
                  <div>
                    <strong>{t("dns.primary")}</strong> {selectedProvider.primary}
                  </div>
                  <div>
                    <strong>{t("dns.secondary")}</strong> {selectedProvider.secondary}
                  </div>
                </div>
              </div>
              <p className="text-sm text-sparkle-text-secondary mb-4">
                {t("dns.changeWarning")}
              </p>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)} variant="secondary">
              {t("common.cancel")}
            </Button>
            <Button onClick={() => applyDNS(selectedProvider)} disabled={loading}>
              {loading ? t("dns.applying") : t("common.apply")}
            </Button>
          </div>
        </div>
      </Modal>
      <RootDiv>
        <div className="pb-10 mr-4">
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-semibold">{t("dns.currentSettings")}</h2>
              <Button onClick={getCurrentDNS} variant="" size="sm" className="ml-auto">
                <RotateCw className="w-5 h-5" />
              </Button>
            </div>

            {currentDNS && currentDNS.length > 0 ? (
              <div className="space-y-2">
                {currentDNS.map((dns, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{dns.adapter}:</span>
                    <span className="text-sparkle-text-secondary">{dns.servers}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-sparkle-text-secondary">
                <AlertCircle className="w-4 h-4" />
                <span>{t("dns.loadingNetwork")}</span>
              </div>
            )}
          </Card>

          <Card className="p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-semibold">{t("dns.findFastest")}</h2>
              <Button
                onClick={testAllPing}
                disabled={pingLoading}
                variant="secondary"
                size="sm"
                className="ml-auto"
              >
                {pingLoading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    {t("dns.testingWait")}
                  </>
                ) : (
                  <>{t("dns.testAll")}</>
                )}
              </Button>
              {pingResults && <Button onClick={() => setPingResults(null)}>{t("dns.clear")}</Button>}
            </div>

            {pingResults && (
              <div className="space-y-2">
                {getLowestPingServer() && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-500 font-medium">
                        {t("dns.fastestDNS", { name: getLowestPingServer()!.name, server: getLowestPingServer()!.server, latency: getLowestPingServer()!.latency })}
                      </span>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  {pingResults.map((result, index) => (
                    <div
                      key={result.server}
                      className={`flex items-center justify-between text-sm p-2 rounded-md ${
                        index === 0 && result.latency !== null
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-sparkle-border-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.status === "success" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">{result.name}</span>
                        <span className="text-sparkle-text-secondary">({result.server})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.latency !== null ? (
                          <span className="text-green-500 font-medium">{result.latency}ms</span>
                        ) : (
                          <span className="text-red-500">
                            {result.status === "timeout" ? t("dns.timeout") : t("dns.error")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!pingResults && !pingLoading && (
              <p className="text-sm text-sparkle-text-secondary">
                {t("dns.testLowestPing")}
              </p>
            )}
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {dnsProviders.map((provider) => (
              <Card
                key={provider.id}
                onClick={() => openConfirmationModal(provider)}
                disabled={loading}
                className="bg-sparkle-card border border-sparkle-border p-4 rounded-2xl hover:border-sparkle-primary transition text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={provider.color}>{provider.icon}</div>

                  <div>
                    <h3 className="font-semibold">
                      {provider.id === "automatic" ? t("dns.autoName") : provider.name}
                      {provider.recommended && (
                        <span className="text-xs text-sparkle-primary ml-2">{t("dns.recommended")}</span>
                      )}
                    </h3>

                    <p className="text-sm text-sparkle-text-secondary">
                      {provider.primary} / {provider.secondary}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-sparkle-text-secondary">{t(`dns.${provider.id}Desc`)}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {provider.features.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-sparkle-border text-xs rounded-md">
                      {feature}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3 ">
              <Settings className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold">{t("dns.customDNS")}</h2>
              <Button onClick={() => setShowCustom(!showCustom)} size="sm">
                {showCustom ? t("dns.hide") : t("dns.show")}
              </Button>
            </div>

            {showCustom && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t("dns.primaryDNS")}</label>
                    <input
                      type="text"
                      value={customDNS.primary}
                      onChange={(e) =>
                        setCustomDNS((prev) => ({ ...prev, primary: e.target.value }))
                      }
                      placeholder={t("dns.dnsPlaceholder")}
                      className="w-full px-3 py-2 bg-sparkle-border border border-sparkle-border-secondary rounded-lg text-sparkle-text focus:outline-hidden focus:border-sparkle-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("dns.secondaryDNS")}
                    </label>
                    <input
                      type="text"
                      value={customDNS.secondary}
                      onChange={(e) =>
                        setCustomDNS((prev) => ({ ...prev, secondary: e.target.value }))
                      }
                      placeholder={t("dns.dnsPlaceholder")}
                      className="w-full px-3 py-2 bg-sparkle-border border border-sparkle-border-secondary rounded-lg text-sparkle-text focus:outline-hidden focus:border-sparkle-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-sparkle-text-secondary">
                  <Info className="w-4 h-4" />
                  <span>{t("dns.enterValidIP")}</span>
                </div>

                <Button
                  onClick={() =>
                    openConfirmationModal({
                      id: "custom",
                      name: t("dns.customDNSName"),
                      primary: customDNS.primary,
                      secondary: customDNS.secondary,
                    })
                  }
                  disabled={!isCustomDNSValid() || loading}
                  className="w-full"
                >
                  {t("dns.applyCustomDNS")}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </RootDiv>
    </>
  )
}
