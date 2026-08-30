import { ipcMain, IpcMainInvokeEvent } from "electron"
import { executePowerShell } from "@main/powershell"
import { exec } from "child_process"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

function sanitizeIP(ip: string): string {
  const valid =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return valid.test(ip) ? ip : ""
}

function sanitizeHostname(hostname: string): string {
  return hostname.replace(/[^a-zA-Z0-9.-]/g, "")
}

interface DNSConfig {
  primary: string
  secondary: string
  name: string
}

const DNS_CONFIGS: Record<string, DNSConfig> = {
  cloudflare: { primary: "1.1.1.1", secondary: "1.0.0.1", name: "Cloudflare" },
  google: { primary: "8.8.8.8", secondary: "8.8.4.4", name: "Google" },
  opendns: { primary: "208.67.222.222", secondary: "208.67.220.220", name: "OpenDNS" },
  quad9: { primary: "9.9.9.9", secondary: "149.112.112.112", name: "Quad9" },
  adguard: { primary: "94.140.14.14", secondary: "94.140.15.15", name: "Adguard DN" },
  automatic: { primary: "", secondary: "", name: "Automatic (DHCP)" },
}

const getActiveAdapters = async (): Promise<{ name: string; ifIndex: number }[]> => {
  return new Promise((resolve) => {
    exec(
      `Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | ConvertTo-Json -Compress`,
      { shell: "powershell.exe" },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([])
          return
        }
        try {
          const parsed = JSON.parse(stdout)
          const adapters = Array.isArray(parsed) ? parsed : [parsed]
          resolve(
            adapters.map((a: any) => ({
              name: a.Name,
              ifIndex: a.ifIndex,
            })),
          )
        } catch {
          resolve([])
        }
      },
    )
  })
}

const setDNSServers = async (ifIndex: number, dnsServers: string[] | null): Promise<boolean> => {
  return new Promise((resolve) => {
    let cmd: string
    if (dnsServers === null) {
      cmd = `Set-DnsClientServerAddress -InterfaceIndex ${ifIndex} -ResetServerAddresses`
    } else {
      const servers = dnsServers.map((s) => `'${s}'`).join(",")
      cmd = `Set-DnsClientServerAddress -InterfaceIndex ${ifIndex} -ServerAddresses @(${servers})`
    }
    exec(cmd, { shell: "powershell.exe" }, (error) => {
      resolve(!error)
    })
  })
}

const flushDNS = async (): Promise<void> => {
  return new Promise((resolve) => {
    exec("ipconfig /flushdns", { shell: "powershell.exe" }, () => resolve())
  })
}

interface DNSResult {
  success: boolean
  data?: any
  error?: string
}

interface ApplyDNSProps {
  dnsType: string
  primaryDNS?: string
  secondaryDNS?: string
}

interface TestDNSProps {
  hostname?: string
}

interface PingResult {
  name: string
  server: string
  latency: number | null
  status: "success" | "timeout" | "error"
}

export const setupDNSHandlers = (): void => {
  ipcMain.handle("dns:get-current", async (): Promise<DNSResult> => {
    try {
      const script = `
      Write-Host "Current DNS Settings:"
      
      Get-DnsClientServerAddress |
      Where-Object { $_.ServerAddresses.Count -gt 0 } |
      ForEach-Object {
          $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue
          if ($adapter) {
              $dnsList = $_.ServerAddresses | Where-Object { $_ -notmatch '^fec0' }
              if ($dnsList) {
                  Write-Host ("{0} | {1}" -f $adapter.Name, ($dnsList -join ', '))
              }
          }
      }
      `

      const result = await executePowerShell({ script, name: "Get-DNS" })

      if (result.success) {
        const lines = result
          .output!.trim()
          .split("\n")
          .filter((line) => line.includes("|"))
        const dnsInfo = lines.map((line) => {
          const [adapter, servers] = line.split("|")
          return { adapter: adapter!.trim(), servers: servers!.trim() }
        })
        return { success: true, data: dnsInfo }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(
    "dns:apply",
    async (_event: IpcMainInvokeEvent, props: ApplyDNSProps): Promise<any> => {
      try {
        const { dnsType, primaryDNS = "", secondaryDNS = "" } = props
        const normalizedType = dnsType.toLowerCase()

        if (normalizedType !== "custom" && !DNS_CONFIGS[normalizedType]) {
          return {
            success: false,
            error:
              "Invalid DNS type. Available options: cloudflare, google, opendns, quad9, adguard, automatic, custom",
          }
        }

        let config: DNSConfig
        if (normalizedType === "custom") {
          const safePrimary = sanitizeIP(primaryDNS)
          if (!safePrimary) {
            return { success: false, error: "Invalid primary DNS server address" }
          }
          const safeSecondary = sanitizeIP(secondaryDNS)
          config = { primary: safePrimary, secondary: safeSecondary, name: "Custom" }
        } else {
          config = DNS_CONFIGS[normalizedType]
        }

        const adapters = await getActiveAdapters()
        if (adapters.length === 0) {
          return { success: false, error: "No active network adapters found" }
        }

        const results: string[] = []
        for (const adapter of adapters) {
          let dnsServers: string[] | null
          if (normalizedType === "automatic" || !config.primary) {
            dnsServers = null
          } else {
            dnsServers = [config.primary]
            if (config.secondary) dnsServers.push(config.secondary)
          }

          const success = await setDNSServers(adapter.ifIndex, dnsServers)
          if (success) {
            if (dnsServers === null) {
              results.push(`Set ${adapter.name} to automatic DNS (DHCP)`)
            } else {
              results.push(`Set ${adapter.name} to ${config.name} DNS: ${dnsServers.join(", ")}`)
            }
          } else {
            results.push(`Error configuring DNS for ${adapter.name}`)
          }
        }

        await flushDNS()

        return {
          success: true,
          output: results.join("\n") + "\nDNS configuration completed successfully!",
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle("dns:reset", async (): Promise<any> => {
    try {
      const adapters = await getActiveAdapters()
      if (adapters.length === 0) {
        return { success: false, error: "No active network adapters found" }
      }

      const results: string[] = []
      for (const adapter of adapters) {
        const success = await setDNSServers(adapter.ifIndex, null)
        if (success) {
          results.push(`Reset ${adapter.name} to automatic DNS (DHCP)`)
        } else {
          results.push(`Error resetting DNS for ${adapter.name}`)
        }
      }

      await flushDNS()

      return {
        success: true,
        output: results.join("\n") + "\nDNS settings reverted to automatic successfully!",
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(
    "dns:test",
    async (_event: IpcMainInvokeEvent, props: TestDNSProps): Promise<any> => {
      try {
        const { hostname = "google.com" } = props
        const safeHostname = sanitizeHostname(hostname) || "google.com"
        const script = `
        try {
          $result = nslookup ${safeHostname} 2>&1
          Write-Host "DNS Test Results for ${safeHostname}:"
          Write-Host $result
        } catch {
          Write-Host "Error testing DNS: $($_.Exception.Message)"
        }
      `
        const result = await executePowerShell({ script, name: "Test-DNS" })
        return result
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle(
    "dns:ping-all",
    async (): Promise<{ success: boolean; data?: PingResult[]; error?: string }> => {
      try {
        const dnsServers: { name: string; server: string }[] = [
          { name: "Cloudflare", server: "1.1.1.1" },
          { name: "Google", server: "8.8.8.8" },
          { name: "OpenDNS", server: "208.67.222.222" },
          { name: "Quad9", server: "9.9.9.9" },
          { name: "AdGuard DNS", server: "94.140.14.14" },
        ]

        const pingServer = (
          server: string,
        ): Promise<{ latency: number | null; status: "success" | "timeout" | "error" }> => {
          return new Promise((resolve) => {
            exec(`ping -n 1 -w 1000 ${server}`, { shell: "cmd.exe" }, (error, stdout) => {
              if (error) {
                resolve({ latency: null, status: "error" })
                return
              }

              const match =
                stdout.match(/Average[^\d]*(\d+)ms/i) || stdout.match(/Average = (\d+)ms/i)
              if (match) {
                resolve({ latency: parseInt(match[1], 10), status: "success" })
              } else if (stdout.includes("TTL=") || stdout.includes("ttl=")) {
                resolve({ latency: null, status: "timeout" })
              } else {
                resolve({ latency: null, status: "timeout" })
              }
            })
          })
        }

        const settled = await Promise.allSettled(
          dnsServers.map(async (dns) => {
            const pingResult = await pingServer(dns.server)
            return { name: dns.name, server: dns.server, ...pingResult }
          }),
        )

        const results = settled
          .filter((r): r is PromiseFulfilledResult<PingResult> => r.status === "fulfilled")
          .map((r) => r.value)

        return { success: true, data: results }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle("dns:get-adapters", async (): Promise<DNSResult> => {
    try {
      const script = `
        Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | ForEach-Object {
          Write-Host "$($_.Name)|$($_.InterfaceDescription)|$($_.Status)"
        }
      `
      const result = await executePowerShell({ script, name: "Get-Adapters" })

      if (result.success) {
        const lines = result
          .output!.trim()
          .split("\n")
          .filter((line) => line.includes("|"))
        const adapters = lines.map((line) => {
          const [name, description, status] = line.split("|")
          return { name: name!.trim(), description: description!.trim(), status: status!.trim() }
        })
        return { success: true, data: adapters }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("dns:flush-cache", async (): Promise<any> => {
    try {
      const script = `
        Write-Host "Flushing DNS cache..."
        ipconfig /flushdns
        Write-Host "DNS cache flushed successfully!"
      `
      const result = await executePowerShell({ script, name: "Flush-DNS" })
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  console.log("[Sparkle main/dnsHandler.ts]: DNS handlers setup complete")
}

export const cleanupDNSHandlers = (): void => {
  ipcMain.removeHandler("dns:get-current")
  ipcMain.removeHandler("dns:apply")
  ipcMain.removeHandler("dns:reset")
  ipcMain.removeHandler("dns:test")
  ipcMain.removeHandler("dns:ping-all")
  ipcMain.removeHandler("dns:get-adapters")
  ipcMain.removeHandler("dns:flush-cache")
}

export default {
  setupDNSHandlers,
  cleanupDNSHandlers,
}
