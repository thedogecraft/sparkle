import RootDiv from "@/components/rootdiv"
import { Zap, Wrench, ExternalLink, Shield, Cpu, Box, LayoutGrid } from "lucide-react"
import Button from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import Card from "@/components/ui/Card"

function Home() {
  const router = useNavigate()
  const goToTweaks = () => router("tweaks")
  const goToUtilities = () => router("utilities")
  const goToApps = () => router("apps")

  return (
    <RootDiv>
      <div className="max-w-450 mx-auto px-4">
        <div className="text-center py-16">
          <h1 className="text-5xl font-bold text-sparkle-text mb-4 tracking-tight">
            Welcome to Sparkle
          </h1>
          <p className="text-lg text-sparkle-text-secondary mb-8 max-w-md mx-auto">
            The ultimate tool to debloat and optimize Windows, and enhance your privacy.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={goToTweaks}>
              <Wrench size={16} className="mr-2" /> Browse Tweaks
            </Button>
            <Button onClick={goToUtilities}>
              <Box size={16} className="mr-2" /> Go To Utilities
            </Button>
            <Button onClick={goToApps}>
              <LayoutGrid size={16} className="mr-2" /> Go To Apps
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-sparkle-card border border-sparkle-border rounded-xl p-5 flex flex-col gap-3 hover:border-sparkle-primary/40 transition-colors">
            <div className="p-2.5 bg-blue-500/10 rounded-lg w-fit">
              <Cpu className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sparkle-text text-sm">Performance Tweaks</h3>
              <p className="text-sparkle-text-secondary text-xs mt-1 leading-relaxed">
                Speed up boot times on low end systems and reduce latency
              </p>
            </div>
          </Card>

          <Card className="bg-sparkle-card border border-sparkle-border rounded-xl p-5 flex flex-col gap-3 hover:border-sparkle-primary/40 transition-colors">
            <div className="p-2.5 bg-green-500/10 rounded-lg w-fit">
              <Shield className="text-green-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sparkle-text text-sm">Privacy Controls</h3>
              <p className="text-sparkle-text-secondary text-xs mt-1 leading-relaxed">
                Disable telemetry and lock down Windows data collection settings.
              </p>
            </div>
          </Card>

          <Card className="bg-sparkle-card border border-sparkle-border rounded-xl p-5 flex flex-col gap-3 hover:border-sparkle-primary/40 transition-colors">
            <div className="p-2.5 bg-purple-500/10 rounded-lg w-fit">
              <Wrench className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sparkle-text text-sm">Customization</h3>
              <p className="text-sparkle-text-secondary text-xs mt-1 leading-relaxed">
                Personalize the Windows experience to match your workflow and preferences.
              </p>
            </div>
          </Card>
        </div>

        {/* CTA Banner */}
        <Card className="bg-sparkle-card border border-sparkle-border rounded-xl p-4 w-full mb-6 flex gap-4 items-center hover:border-green-500/30 transition-colors">
          <div className="p-3 bg-green-500/10 rounded-lg shrink-0">
            <Zap className="text-green-500" size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sparkle-text text-sm">PC Running Slow?</h2>
            <p className="text-sparkle-text-secondary text-xs mt-0.5">
              Apply recommended tweaks to improve performance and privacy in minutes.
            </p>
          </div>
          <div className="ml-auto shrink-0">
            <Button
              variant="outline"
              className="flex items-center gap-2 text-sm"
              onClick={goToTweaks}
            >
              <Wrench size={15} /> Open Tweaks
            </Button>
          </div>
        </Card>

        {/* Footer note */}
        <div className="text-center text-xs text-sparkle-text-secondary pb-6">
          <a
            href="https://github.com/anomalyco/sparkle/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-sparkle-primary transition-colors"
          >
            <ExternalLink size={12} />
            Why was system info removed?
          </a>
        </div>
      </div>
    </RootDiv>
  )
}

export default Home
