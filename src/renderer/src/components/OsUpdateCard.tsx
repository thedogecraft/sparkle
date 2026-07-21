import { useEffect } from "react"
import Button from "./ui/button"
import Card from "./ui/Card"
import useOsUpdatesStore from "@/store/osUpdatesStore"
import { CheckCircle2, Loader2, MonitorCog, RotateCw } from "lucide-react"

function OsUpdateCard() {
  const { updates, checking, installing, error, lastChecked, check, install } = useOsUpdatesStore()

  useEffect(() => {
    if (lastChecked === null) check()
  }, [check, lastChecked])

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MonitorCog className="w-6 h-6 text-sparkle-primary shrink-0" />
          <div>
            <div className="text-sparkle-text font-medium">Windows Update</div>
            {checking && updates.length === 0 ? (
              <div className="text-xs text-sparkle-text-secondary">
                Checking for Windows updates... (this can take up to 30s)
              </div>
            ) : error ? (
              <div className="text-xs text-red-500">{error}</div>
            ) : updates.length === 0 ? (
              <div className="text-xs text-sparkle-text-secondary flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Windows is up to date
              </div>
            ) : (
              <div className="text-xs text-sparkle-text-secondary">
                {updates.length} update{updates.length !== 1 ? "s" : ""} available —{" "}
                {updates
                  .slice(0, 2)
                  .map((u) => u.title)
                  .join(", ")}
                {updates.length > 2 ? "..." : ""}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={check} disabled={checking || installing}>
            <RotateCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
          </Button>
          {updates.length > 0 && (
            <Button onClick={() => install(updates)} disabled={checking || installing} className="flex items-center gap-2">
              {installing && <Loader2 className="w-4 h-4 animate-spin" />}
              {installing ? "Installing..." : "Install Updates"}
            </Button>
          )}
        </div>
      </div>
      {updates.length > 0 && (
        <p className="text-xs text-sparkle-text-muted mt-2">
          Updates download and stage in the background — no restart happens automatically. If one
          is needed afterward, the power menu will offer "Update and restart".
        </p>
      )}
    </Card>
  )
}

export default OsUpdateCard
