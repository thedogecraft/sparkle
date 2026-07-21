import { useEffect, useState } from "react"
import Button from "./ui/button"
import Card from "./ui/Card"
import { invoke } from "@/lib/electron"
import useDriverUpdatesStore from "@/store/driverUpdatesStore"
import useAppInstallStore from "@/store/appInstallStore"
import { Cpu, Download, ExternalLink, Loader2, RotateCw } from "lucide-react"
import { toast } from "react-toastify"

function GpuDriverCard() {
  const { gpu, gpuChecking, gpuError, checkGpu } = useDriverUpdatesStore()
  const [downloading, setDownloading] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [installingApp, setInstallingApp] = useState(false)

  useEffect(() => {
    checkGpu()
  }, [checkGpu])

  async function downloadNvidiaDriver() {
    if (!gpu?.nvidia?.downloadUrl) return
    setDownloading(true)
    const install = useAppInstallStore.getState()
    install.clearApps()
    install.setAction("update")
    install.addApp("nvidia-driver", "NVIDIA Driver")
    try {
      const result = await invoke({
        channel: "gpu-driver:download",
        payload: { url: gpu.nvidia.downloadUrl, appId: "nvidia-driver" },
      })
      if (!result?.success) toast.error("Failed to download the driver installer.")
    } catch {
      toast.error("Failed to download the driver installer.")
    } finally {
      setDownloading(false)
    }
  }

  async function launchVendorApp() {
    if (!gpu?.vendorAppName) return
    setLaunching(true)
    try {
      const result = await invoke({ channel: "gpu-driver:launch-app", payload: { nameHint: gpu.vendorAppName } })
      if (!result?.success) toast.error(`Couldn't find ${gpu.vendorAppName} to launch.`)
    } catch {
      toast.error(`Couldn't launch ${gpu.vendorAppName}.`)
    } finally {
      setLaunching(false)
    }
  }

  async function installVendorApp() {
    if (!gpu?.vendorAppId || !gpu?.vendorAppName) return
    setInstallingApp(true)
    const install = useAppInstallStore.getState()
    install.clearApps()
    install.setAction("install")
    install.addApp(gpu.vendorAppId, gpu.vendorAppName)
    try {
      await invoke({
        channel: "handle-apps",
        payload: { action: "install", apps: [gpu.vendorAppId], source: "" },
      })
    } catch {
      toast.error(`Failed to install ${gpu.vendorAppName}.`)
    } finally {
      setInstallingApp(false)
      checkGpu()
    }
  }

  if (gpuChecking && !gpu) {
    return (
      <Card className="p-4 flex items-center gap-2 text-sparkle-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking your GPU...
      </Card>
    )
  }

  if (gpuError) {
    return (
      <Card className="p-4 text-sm text-red-500">
        {gpuError}
      </Card>
    )
  }

  if (!gpu || !gpu.hasGPU) {
    return (
      <Card className="p-4 text-sm text-sparkle-text-secondary">
        No dedicated GPU detected on this PC.
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sparkle-primary" />
          <div>
            <div className="text-sparkle-text font-medium">{gpu.model}</div>
            <div className="text-xs text-sparkle-text-secondary">
              Installed driver: {gpu.installedVersion || "Unknown"}
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={checkGpu} disabled={gpuChecking} className="flex items-center gap-2">
          <RotateCw className={`w-4 h-4 ${gpuChecking ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {gpu.nvidia?.supported ? (
        <div className="flex items-center justify-between bg-sparkle-accent/50 rounded-lg p-3">
          <div>
            <div className="text-sm text-sparkle-text">
              Latest available: <span className="text-sparkle-primary">{gpu.nvidia.latestVersion}</span>
            </div>
            <div className="text-xs text-sparkle-text-secondary">
              Released {gpu.nvidia.releaseDate} · {gpu.nvidia.downloadSizeText}
            </div>
            <div className="text-xs text-sparkle-text-muted mt-1">
              Compare against your installed version above — Nvidia's version numbers don't map
              directly onto Windows' driver version format.
            </div>
          </div>
          <Button onClick={downloadNvidiaDriver} disabled={downloading} className="flex items-center gap-2 shrink-0">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Downloading..." : "Download & Install"}
          </Button>
        </div>
      ) : gpu.vendorAppInstallable ? (
        <div className="flex items-center justify-between bg-sparkle-accent/50 rounded-lg p-3">
          <div className="text-sm text-sparkle-text-secondary">
            {gpu.nvidia?.reason ??
              `Automatic version lookup isn't available for this GPU. Use ${gpu.vendorAppName} to check for driver updates.`}
          </div>
          {gpu.vendorAppInstalled ? (
            <Button onClick={launchVendorApp} disabled={launching} className="flex items-center gap-2 shrink-0">
              {launching && <Loader2 className="w-4 h-4 animate-spin" />}
              Open {gpu.vendorAppName}
            </Button>
          ) : (
            <Button onClick={installVendorApp} disabled={installingApp} className="flex items-center gap-2 shrink-0">
              {installingApp && <Loader2 className="w-4 h-4 animate-spin" />}
              Install {gpu.vendorAppName}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-sparkle-accent/50 rounded-lg p-3">
          <div className="text-sm text-sparkle-text-secondary">
            Sparkle can't automatically check drivers for this GPU yet. Check the manufacturer's
            site directly.
          </div>
          {gpu.manualUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(gpu.manualUrl, "_blank")}
              className="flex items-center gap-2 shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              Open Driver Page
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default GpuDriverCard
