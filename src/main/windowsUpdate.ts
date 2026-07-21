import type { WindowsUpdateItem } from "../types"

// Wraps the Windows Update Agent COM API (the same interfaces the
// PSWindowsUpdate module and Windows' own Settings app use).
//
// ServerSelection is forced to 2 (public Microsoft servers) with an explicit
// ServiceID, rather than left at the default. On machines pointed at a WSUS
// server (common on managed/work devices; confirmed empirically on the dev
// machine via `UseWUServer=1`), the default silently queries the internal
// WSUS server instead of Microsoft and returns 0 results with no error. This
// override is what a home/personal PC needs anyway, so it's correct in both
// environments, not just a workaround.
const PUBLIC_WU_SERVICE_ID = "7971f918-a847-4430-9279-4a52d1efe18d"

// COM's IUpdateSearcher/IUpdateInstaller ResultCode enum.
export const WU_RESULT_SUCCEEDED = 2
export const WU_RESULT_SUCCEEDED_WITH_ERRORS = 3

export type { WindowsUpdateItem }

// UpdateID is always a GUID; validated before being interpolated into the
// install script.
export const UPDATE_ID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function comSearchPreamble(): string {
  return [
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "$session = New-Object -ComObject Microsoft.Update.Session",
    "$searcher = $session.CreateUpdateSearcher()",
    "$searcher.ServerSelection = 2",
    `$searcher.ServiceID = "${PUBLIC_WU_SERVICE_ID}"`,
  ].join("\n")
}

export function buildSearchScript(type: "Driver" | "Software"): string {
  return [
    comSearchPreamble(),
    "try {",
    `  $result = $searcher.Search("IsInstalled=0 and Type='${type}'")`,
    "  $items = @()",
    "  foreach ($u in $result.Updates) {",
    "    $items += [PSCustomObject]@{",
    "      updateId = $u.Identity.UpdateID",
    "      title = $u.Title",
    "      kb = ($u.KBArticleIDs -join ',')",
    `      type = "${type}"`,
    "      sizeBytes = [int64]$u.MaxDownloadSize",
    "      driverProvider = $u.DriverProvider",
    "      driverClass = $u.DriverClass",
    "      driverVerDate = if ($u.DriverVerDate) { $u.DriverVerDate.ToString('yyyy-MM-dd') } else { '' }",
    "    }",
    "  }",
    "  [PSCustomObject]@{ items = $items } | ConvertTo-Json -Depth 4 -Compress",
    "} catch {",
    '  [PSCustomObject]@{ items = @(); error = $_.Exception.Message } | ConvertTo-Json -Compress',
    "}",
    "exit 0",
  ].join("\n")
}

export function parseSearchOutput(raw: string): { items: WindowsUpdateItem[]; error?: string } {
  try {
    // ConvertTo-Json's output is usually the only thing on stdout, but COM
    // can emit warnings above it; take the last line that parses as JSON.
    const lines = raw.trim().split("\n")
    for (let i = lines.length - 1; i >= 0; i--) {
      const candidate = lines.slice(i).join("\n").trim()
      if (!candidate.startsWith("{")) continue
      try {
        const parsed = JSON.parse(candidate)
        const items = Array.isArray(parsed.items) ? parsed.items : parsed.items ? [parsed.items] : []
        return { items, error: parsed.error }
      } catch {
        continue
      }
    }
    return { items: [] }
  } catch (err: any) {
    return { items: [], error: err?.message ?? String(err) }
  }
}

export function buildInstallScript(updateIds: string[]): string {
  const safeIds = updateIds.filter((id) => UPDATE_ID_PATTERN.test(id))
  const idList = safeIds.map((id) => `"${id}"`).join(",")
  return [
    comSearchPreamble(),
    `$ids = @(${idList})`,
    "try {",
    "  $result = $searcher.Search(\"IsInstalled=0\")",
    "  $toProcess = New-Object -ComObject Microsoft.Update.UpdateColl",
    "  foreach ($u in $result.Updates) {",
    "    if ($ids -contains $u.Identity.UpdateID) {",
    "      if (-not $u.EulaAccepted) { $u.AcceptEula() }",
    "      $toProcess.Add($u) | Out-Null",
    "    }",
    "  }",
    "  if ($toProcess.Count -eq 0) {",
    "    Write-Output 'No matching updates found (they may already be installed).'",
    "    exit 0",
    "  }",
    "  Write-Output \"Downloading $($toProcess.Count) update(s)...\"",
    "  $downloader = $session.CreateUpdateDownloader()",
    "  $downloader.Updates = $toProcess",
    "  $dlResult = $downloader.Download()",
    "  Write-Output \"Download finished (code $($dlResult.ResultCode)).\"",
    "",
    "  $toInstall = New-Object -ComObject Microsoft.Update.UpdateColl",
    "  foreach ($u in $toProcess) { if ($u.IsDownloaded) { $toInstall.Add($u) | Out-Null } }",
    "  if ($toInstall.Count -eq 0) {",
    "    Write-Output 'Nothing downloaded successfully.'",
    "    exit 1",
    "  }",
    "  Write-Output \"Installing $($toInstall.Count) update(s)...\"",
    "  $installer = $session.CreateUpdateInstaller()",
    "  $installer.AllowSourcePrompts = $false",
    "  $installer.Updates = $toInstall",
    "  $instResult = $installer.Install()",
    "  Write-Output \"Install finished (code $($instResult.ResultCode)). Reboot required: $($instResult.RebootRequired)\"",
    "  if ($instResult.ResultCode -eq 2 -or $instResult.ResultCode -eq 3) { exit 0 } else { exit 1 }",
    "} catch {",
    "  Write-Output \"Error: $($_.Exception.Message)\"",
    "  exit 1",
    "}",
  ].join("\n")
}
