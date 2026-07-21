import { useEffect } from "react"
import Button from "./ui/button"
import Card from "./ui/Card"
import GpuDriverCard from "./GpuDriverCard"
import useDriverUpdatesStore from "@/store/driverUpdatesStore"
import useAppInstallStore from "@/store/appInstallStore"
import { CheckCircle2, ChevronDown, Loader2, RotateCw, XCircle, ArrowUpCircle } from "lucide-react"

function DriversTab() {
  const { updates, vendorGroups, checking, installing, error, check, install } = useDriverUpdatesStore()
  const installApps = useAppInstallStore((s) => s.apps)

  useEffect(() => {
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusFor = (id: string) => installApps.find((a) => a.id === id)?.status

  function updateDevice(updateId: string) {
    const item = updates.find((u) => u.updateId === updateId)
    if (item) install([item])
  }

  const updatableCount = vendorGroups.reduce(
    (sum, g) => sum + g.devices.filter((d) => d.updateId).length,
    0,
  )

  return (
    <>
      <GpuDriverCard />

      <div className="flex items-center justify-between mt-4 mb-4">
        <h2 className="text-lg font-semibold text-sparkle-text">
          Detected Hardware {!checking && vendorGroups.length > 0 && `(${vendorGroups.length} vendors)`}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={check} disabled={checking || installing} className="flex items-center gap-2">
            <RotateCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {updatableCount > 0 && (
            <Button
              disabled={checking || installing}
              onClick={() => install(updates)}
              className="flex items-center gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Update All ({updatableCount})
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-red-500">{error}</div>}

      {checking && vendorGroups.length === 0 ? (
        <Card className="p-8 text-center text-sparkle-text-secondary">
          Scanning installed hardware and checking Windows Update... (this can take up to 30s)
        </Card>
      ) : vendorGroups.length === 0 ? (
        <Card className="p-8 text-center text-sparkle-text-secondary">No hardware detected.</Card>
      ) : (
        <div className="space-y-3">
          {vendorGroups.map((group) => (
            <details
              key={group.vendor}
              className="bg-sparkle-card border border-sparkle-border rounded-xl overflow-hidden group"
              open={group.devices.some((d) => d.updateId)}
            >
              <summary className="flex items-center justify-between p-3 cursor-pointer select-none list-none">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-sparkle-text-secondary transition-transform group-open:rotate-180" />
                  <span className="text-sparkle-text font-medium">{group.vendor}</span>
                  <span className="text-xs text-sparkle-text-secondary">
                    {group.devices.length} device{group.devices.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {group.devices.some((d) => d.updateId) && (
                  <span className="rounded-full bg-sparkle-primary/10 text-sparkle-primary text-[10px] px-2 py-0.5">
                    {group.devices.filter((d) => d.updateId).length} update
                    {group.devices.filter((d) => d.updateId).length !== 1 ? "s" : ""}
                  </span>
                )}
              </summary>
              <div className="border-t border-sparkle-border divide-y divide-sparkle-border">
                {group.devices.map((device) => {
                  const status = device.updateId ? statusFor(device.updateId) : undefined
                  return (
                    <div key={`${device.deviceName}-${device.driverVersion}`} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <div className="text-sm text-sparkle-text">{device.deviceName}</div>
                        <div className="text-xs text-sparkle-text-secondary">
                          v{device.driverVersion || "Unknown"}
                          {device.driverDate && ` · ${device.driverDate}`}
                        </div>
                      </div>
                      {device.updateId &&
                        (status === "installing" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-sparkle-primary" />
                        ) : status === "complete" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : status === "error" ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Button variant="outline" onClick={() => updateDevice(device.updateId!)} disabled={installing || checking}>
                            Update
                          </Button>
                        ))}
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      )}

      <p className="text-sm text-sparkle-text-secondary mt-4">
        Hardware is detected directly from Windows; update availability comes from Windows Update,
        which only offers WHQL-certified drivers — often older than what your GPU vendor's own app
        provides. Use the card above for the latest GPU driver specifically.
      </p>
    </>
  )
}

export default DriversTab
