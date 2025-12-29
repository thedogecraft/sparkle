import RootDiv from "@/components/rootdiv"
import { useEffect, useState } from "react"
import jsonData from "../../../../package.json"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import Toggle from "@/components/ui/toggle"
import { toast } from "react-toastify"
import Card from "@/components/ui/Card"

const themes = [
  { label: "System", value: "system" },
  { label: "Dark", value: "dark" },
  { label: "Light", value: "light" },
  { label: "Purple", value: "purple" },
  { label: "Gray", value: "gray" },
  { label: "Classic", value: "classic" },
]

/**
 * Render the Settings page for Sparkle, providing controls for appearance, updates, profile,
 * privacy, data management, integrations, and troubleshooting.
 *
 * The component persists selected settings to localStorage, updates document body classes for
 * theme and analytics capture, and communicates with the host via IPC channels for actions
 * like checking for updates, toggling Discord Rich Presence, managing the tray icon, clearing
 * cache, and restarting Explorer.
 *
 * @param {{ onCheckForUpdates?: Function }} props
 * @param {Function} [props.onCheckForUpdates] - Optional callback invoked to trigger an external update check.
 * @returns {import('react').ReactElement} The Settings React element.
 */
function Settings({ onCheckForUpdates }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system")
  const [checking, setChecking] = useState(false)
  const [discordEnabled, setDiscordEnabled] = useState(true)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [trayEnabled, setTrayEnabled] = useState(true)
  const [trayLoading, setTrayLoading] = useState(false)
  const [posthogDisabled, setPosthogDisabled] = useState(() => {
    return localStorage.getItem("posthogDisabled") === "true"
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const checkForUpdates = async () => {
    try {
      setChecking(true)
      const res = await invoke({ channel: "updater:check" })
      if (res?.ok && !res.updateInfo) {
        toast.success("You're up to date")
      }
    } catch (e) {
      toast.error(String(e))
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    document.body.classList.remove("light", "purple", "dark", "gray", "classic")
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      document.body.classList.add(systemTheme)
    } else if (theme) {
      document.body.classList.add(theme)
    } else {
      document.body.classList.add("dark")
    }
    localStorage.setItem("theme", theme || "dark")
  }, [theme])

  useEffect(() => {
    invoke({ channel: "discord-rpc:get" }).then((status) => setDiscordEnabled(status))
    invoke({ channel: "tray:get" }).then((status) => setTrayEnabled(status))
  }, [])

  useEffect(() => {
    if (posthogDisabled) {
      document.body.classList.add("ph-no-capture")
    } else {
      document.body.classList.remove("ph-no-capture")
    }
    localStorage.setItem("posthogDisabled", posthogDisabled)
  }, [posthogDisabled])

  const handleToggleDiscord = async () => {
    setDiscordLoading(true)
    const newStatus = !discordEnabled
    await invoke({ channel: "discord-rpc:toggle", payload: newStatus })
    setDiscordEnabled(newStatus)
    setDiscordLoading(false)
  }

  const clearCache = async () => {
    await invoke({ channel: "clear-sparkle-cache" })
    localStorage.removeItem("sparkle:systemInfo")
    localStorage.removeItem("sparkle:tweakInfo")
    toast.success("Sparkle cache cleared successfully!")
  }

  const handleToggleTray = async () => {
    setTrayLoading(true)
    const newStatus = !trayEnabled
    await invoke({ channel: "tray:set", payload: newStatus })
    setTrayEnabled(newStatus)
    setTrayLoading(false)
  }

  const handleRestartExplorer = async () => {
    try {
      await invoke({ channel: "restart-explorer" })
      toast.success("Explorer restarted successfully")
    } catch (e) {
      toast.error("Failed to restart explorer: " + String(e))
    }
  }

  return (
    <>
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">Delete Legacy Backups</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Are you sure you want to delete all legacy registry backups? This will permanently
              remove the{" "}
              <code className="bg-sparkle-border-secondary/20 px-1 py-0.5 rounded-sm text-xs">
                C:\Sparkle\Backup
              </code>{" "}
              folder and all its contents.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteModalOpen(false)
                invoke({ channel: "delete-old-sparkle-backups" })
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      <RootDiv>
        <div className="min-h-screen w-full pb-16 overflow-y-auto">
          <div className="space-y-8 ">
            <SettingSection title="Appearance">
              <SettingCard>
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-sparkle-text">Theme</h3>
                  <div className="grid grid-cols-6 gap-3">
                    {themes.map((t) => (
                      <label
                        key={t.value}
                        className={`flex items-center justify-center gap-2 cursor-pointer p-3 rounded-full border transition-all duration-200 active:scale-95 ${theme === t.value ? "border-sparkle-primary" : "border-sparkle-border"
                          }`}
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={t.value}
                          checked={theme === t.value}
                          onChange={() => setTheme(t.value)}
                          className="sr-only"
                        />
                        <span className="text-sparkle-text font-medium">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title="Discord RPC">
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-sparkle-text mb-1">
                      Discord Rich Presence
                    </h3>
                    <p className="text-sm text-sparkle-text-secondary">
                      Show your Sparkle activity on Discord
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={discordEnabled}
                      onChange={handleToggleDiscord}
                      disabled={discordLoading}
                    />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${discordEnabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-sparkle-text-secondary bg-sparkle-border-secondary/20"
                        }`}
                    >
                      {discordEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>
            <SettingSection title="Updates">
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-sparkle-text mb-1">
                      Check for Updates
                    </h3>
                    <p className="text-sm text-sparkle-text-secondary">Check for updates</p>
                  </div>
                  <Button onClick={checkForUpdates} disabled={checking}>
                    {checking ? "Checking..." : "Check for Updates"}
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>
            <SettingSection title="Profile">
              <SettingCard>
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-sparkle-text">User Name</h3>
                  <input
                    type="text"
                    defaultValue={localStorage.getItem("sparkle:user") || ""}
                    onChange={(e) => localStorage.setItem("sparkle:user", e.target.value)}
                    className="w-full bg-sparkle-card border border-sparkle-border rounded-lg px-3 py-2 text-sparkle-text focus:ring-0 focus:outline-hidden"
                    placeholder="Enter your name"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const username = await invoke({ channel: "get-user-name" })
                        localStorage.setItem("sparkle:user", username)
                        toast.success("Name reset to system user")
                      }}
                    >
                      Reset to System Name
                    </Button>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title="Privacy">
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-sparkle-text mb-1">
                      Disable Analytics
                    </h3>
                    <p className="text-sm text-sparkle-text-secondary">
                      Disables Posthog analytics
                      <span className="inline-flex items-center gap-1 ml-2 text-yellow-500">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        Requires restart
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={posthogDisabled}
                      onChange={() => setPosthogDisabled((v) => !v)}
                    />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${posthogDisabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-sparkle-text-secondary bg-sparkle-border-secondary/20"
                        }`}
                    >
                      {posthogDisabled ? "Disabled" : "Enabled"}
                    </span>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title="Data Management">
              <SettingCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-sparkle-text mb-1">Legacy Backups</h3>
                    <p className="text-sm text-sparkle-text-secondary">
                      Remove old backup files stored in{" "}
                      <code className="bg-sparkle-border-secondary/20 px-1 py-0.5 rounded-sm text-xs">
                        C:\Sparkle\Backup
                      </code>
                    </p>
                  </div>
                  <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                    Delete Backups
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-sparkle-text mb-1">
                      Clear Sparkle Cache
                    </h3>
                    <p className="text-sm text-sparkle-text-secondary">
                      Remove temporary files/logs Sparkle may leave behind.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={clearCache}>
                    Clear Cache
                  </Button>
                  <Button
                    variant="secondary"
                    className="ml-2"
                    onClick={async () => {
                      await invoke({ channel: "open-log-folder" })
                    }}
                  >
                    Open Log Folder
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title="Other">
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-sparkle-text mb-1">Show tray icon</h3>
                    <p className="text-sm text-sparkle-text-secondary">
                      Enable or disable Sparkle running in the system tray.
                      <span className="inline-flex items-center gap-1 ml-2 text-yellow-500">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        Requires restart
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={trayEnabled}
                      onChange={handleToggleTray}
                      disabled={trayLoading}
                    />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${trayEnabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-sparkle-text-secondary bg-sparkle-border-secondary/20"
                        }`}
                    >
                      {trayEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title="Troubleshooting">
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-sparkle-text mb-1">
                      Restart Explorer
                    </h3>
                    <p className="text-sm text-sparkle-text-secondary">
                      Restarts Windows Explorer and Taskbar. Useful if the taskbar disappears.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleRestartExplorer}>
                    Restart Explorer
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title="About">
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-sparkle-text mb-1">Sparkle</h3>
                    <p className="text-sm text-sparkle-text-secondary">
                      Version {jsonData.version}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-sparkle-text-secondary">
                      © {new Date().getFullYear()} Parcoil Network
                    </p>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>
          </div>
        </div>
      </RootDiv>
    </>
  )
}
// this saves alot of time
const SettingCard = ({ children, className = "" }) => (
  <Card className={`p-4 ${className}`}>{children}</Card>
)

const SettingSection = ({ title, children }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-sparkle-primary">{title}</h2>
    {children}
  </div>
)
export default Settings