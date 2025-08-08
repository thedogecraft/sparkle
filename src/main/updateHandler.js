import { ipcMain, shell } from 'electron'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { executePowerShell } from './powershell'

const execAsync = promisify(exec)

class UpdateHandler {
  constructor() {
    this.updateHistoryPath = path.join(app.getPath('userData'), 'update-history.json')
    this.setupHandlers()
  }

  setupHandlers() {
    ipcMain.handle('check-windows-updates', async () => {
      try {
        console.log('[UpdateHandler] Handling check-windows-updates IPC call')
        const result = await this.checkForUpdates()
        console.log('[UpdateHandler] Check updates result:', result)
        return result
      } catch (error) {
        console.error('[UpdateHandler] Error in IPC handler:', error)
        return {
          success: false,
          error: error.message || 'Unknown error occurred'
        }
      }
    })

    ipcMain.handle('install-windows-updates', async (event, updateIds) => {
      try {
        return await this.installUpdates(updateIds)
      } catch (error) {
        console.error('[UpdateHandler] Error in install handler:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })

    ipcMain.handle('download-update', async (event, updateId) => {
      try {
        return await this.downloadUpdate(updateId)
      } catch (error) {
        console.error('[UpdateHandler] Error in download handler:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })

    ipcMain.handle('get-update-history', async () => {
      try {
        return await this.getUpdateHistory()
      } catch (error) {
        console.error('[UpdateHandler] Error getting history:', error)
        return {
          lastCheck: null,
          lastInstall: null
        }
      }
    })

    ipcMain.handle('open-update-history', async () => {
      try {
        return await this.openUpdateHistory()
      } catch (error) {
        console.error('[UpdateHandler] Error opening history:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })

    ipcMain.handle('restart-windows', async () => {
      try {
        return await this.restartWindows()
      } catch (error) {
        console.error('[UpdateHandler] Error restarting:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })
  }

  async checkForUpdates() {
    console.log('[UpdateHandler] Starting update check...')
    
    try {
      // Simple script to check for updates using Windows Update API
      const script = `
# Check and start Windows Update service if needed
$wuService = Get-Service -Name wuauserv
$wasServiceStopped = $false

if ($wuService.Status -eq 'Stopped') {
    $wasServiceStopped = $true
    Write-Host "Starting Windows Update service temporarily..."
    Start-Service -Name wuauserv -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

try {
    Write-Host "Creating update session..."
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    
    Write-Host "Searching for updates..."
    $searchResult = $searcher.Search("IsInstalled=0 and Type='Software'")
    
    $updates = @()
    
    Write-Host "Found $($searchResult.Updates.Count) updates"
    
    foreach ($update in $searchResult.Updates) {
        $size = 0
        foreach ($content in $update.DownloadContents) {
            $size += $content.DownloadSize
        }
        if ($size -eq 0 -and $update.MaxDownloadSize) {
            $size = $update.MaxDownloadSize
        }
        
        $updateObj = @{
            id = $update.Identity.UpdateID
            title = $update.Title
            description = if ($update.Description -and $update.Description.Length -gt 200) { 
                $update.Description.Substring(0, 200) + "..." 
            } else { 
                $update.Description 
            }
            size = $size
            type = "Software"
            severity = if ($update.MsrcSeverity) { $update.MsrcSeverity } else { "Normal" }
            downloaded = $update.IsDownloaded
            mandatory = $update.IsMandatory
            rebootRequired = $update.RebootRequired
        }
        $updates += $updateObj
    }
    
    # Also check for driver updates
    try {
        $driverResult = $searcher.Search("IsInstalled=0 and Type='Driver'")
        foreach ($update in $driverResult.Updates) {
            $size = 0
            foreach ($content in $update.DownloadContents) {
                $size += $content.DownloadSize
            }
            if ($size -eq 0 -and $update.MaxDownloadSize) {
                $size = $update.MaxDownloadSize
            }
            
            $updateObj = @{
                id = $update.Identity.UpdateID
                title = $update.Title
                description = if ($update.Description -and $update.Description.Length -gt 200) { 
                    $update.Description.Substring(0, 200) + "..." 
                } else { 
                    $update.Description 
                }
                size = $size
                type = "Driver"
                severity = "Optional"
                downloaded = $update.IsDownloaded
                mandatory = $update.IsMandatory
                rebootRequired = $update.RebootRequired
            }
            $updates += $updateObj
        }
    } catch {
        Write-Host "Could not check for driver updates"
    }
    
    # Stop service if it was stopped before
    if ($wasServiceStopped) {
        Write-Host "Stopping Windows Update service..."
        Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
    }
    
    @{
        success = $true
        updates = $updates
        count = $updates.Count
    } | ConvertTo-Json -Depth 10
} catch {
    # Stop service if it was stopped before
    if ($wasServiceStopped) {
        Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
    }
    
    @{
        success = $false
        error = $_.Exception.Message
        errorCode = $_.Exception.HResult
    } | ConvertTo-Json
}
      `.trim()
      
      console.log('[UpdateHandler] Executing PowerShell script for update check...')
      const result = await executePowerShell(null, {
        script: script,
        name: 'check-windows-updates'
      })
      
      console.log('[UpdateHandler] PowerShell execution result:', JSON.stringify(result))
      
      if (result.success && result.output) {
        try {
          // Try to find JSON in the output (PowerShell might output other text)
          const jsonMatch = result.output.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const updateData = JSON.parse(jsonMatch[0])
            
            if (updateData.success) {
              await this.saveUpdateHistory({ lastCheck: new Date().toISOString() })
            }
            
            console.log('[UpdateHandler] Parsed update data:', updateData)
            return updateData
          } else {
            console.error('[UpdateHandler] No JSON found in output')
            console.log('[UpdateHandler] Raw output:', result.output)
            return {
              success: false,
              error: 'Invalid response format from Windows Update service'
            }
          }
        } catch (parseError) {
          console.error('[UpdateHandler] Failed to parse update data:', parseError)
          console.log('[UpdateHandler] Raw output:', result.output)
          return {
            success: false,
            error: `Parse error: ${parseError.message}`
          }
        }
      } else {
        console.error('[UpdateHandler] PowerShell execution failed or no output')
        return {
          success: false,
          error: result.error || 'Failed to execute update check. Make sure you are running as administrator.'
        }
      }
    } catch (error) {
      console.error('[UpdateHandler] Error in checkForUpdates:', error)
      return {
        success: false,
        error: error.message || 'An unexpected error occurred while checking for updates'
      }
    }
  }

  async installUpdates(updateIds) {
    console.log('Installing updates:', updateIds)
    
    try {
      const idsString = updateIds && updateIds.length > 0 
        ? updateIds.map(id => `"${id}"`).join(',') 
        : ''
      
      const script = `
# Ensure Windows Update service is running
Start-Service -Name wuauserv -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

try {
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    
    Write-Host "Searching for available updates..."
    $searchResult = $searcher.Search("IsInstalled=0")
    
    $updatesToInstall = New-Object -ComObject Microsoft.Update.UpdateColl
    $updateIds = @(${idsString})
    
    foreach ($update in $searchResult.Updates) {
        if ($updateIds.Count -eq 0 -or $updateIds -contains $update.Identity.UpdateID) {
            $updatesToInstall.Add($update) | Out-Null
            Write-Host "Added to install queue: $($update.Title)"
        }
    }
    
    if ($updatesToInstall.Count -eq 0) {
        @{
            success = $false
            error = "No matching updates found to install"
        } | ConvertTo-Json
        return
    }
    
    Write-Host "Downloading $($updatesToInstall.Count) updates..."
    $downloader = $session.CreateUpdateDownloader()
    $downloader.Updates = $updatesToInstall
    $downloadResult = $downloader.Download()
    
    if ($downloadResult.ResultCode -ne 2) {
        @{
            success = $false
            error = "Failed to download updates. Result code: $($downloadResult.ResultCode)"
        } | ConvertTo-Json
        return
    }
    
    Write-Host "Installing updates..."
    $installer = $session.CreateUpdateInstaller()
    $installer.Updates = $updatesToInstall
    $installResult = $installer.Install()
    
    $requiresRestart = $false
    foreach ($update in $updatesToInstall) {
        if ($update.RebootRequired) {
            $requiresRestart = $true
            break
        }
    }
    
    @{
        success = ($installResult.ResultCode -eq 2 -or $installResult.ResultCode -eq 3)
        resultCode = $installResult.ResultCode
        requiresRestart = $requiresRestart
        installedCount = $updatesToInstall.Count
        message = switch ($installResult.ResultCode) {
            0 { "Not started" }
            1 { "In progress" }
            2 { "Succeeded" }
            3 { "Succeeded with errors" }
            4 { "Failed" }
            5 { "Aborted" }
            default { "Unknown" }
        }
    } | ConvertTo-Json
} catch {
    @{
        success = $false
        error = $_.Exception.Message
    } | ConvertTo-Json
}
      `.trim()
      
      const result = await executePowerShell(null, {
        script: script,
        name: 'install-windows-updates'
      })
      
      console.log('[UpdateHandler] Install PowerShell result:', JSON.stringify(result))
      
      if (result.success && result.output) {
        try {
          // Try to find JSON in the output (PowerShell might output other text)
          const jsonMatch = result.output.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const installData = JSON.parse(jsonMatch[0])
            
            if (installData.success) {
              await this.saveUpdateHistory({ 
                lastInstall: new Date().toISOString(),
                installedCount: installData.installedCount
              })
            }
            
            console.log('[UpdateHandler] Parsed install data:', installData)
            return installData
          } else {
            console.error('[UpdateHandler] No JSON found in install output')
            console.log('[UpdateHandler] Raw install output:', result.output)
            return {
              success: false,
              error: 'Invalid response format from Windows Update installer'
            }
          }
        } catch (parseError) {
          console.error('[UpdateHandler] Failed to parse install result:', parseError)
          console.log('[UpdateHandler] Raw install output:', result.output)
          return {
            success: false,
            error: `Install parse error: ${parseError.message}`
          }
        }
      } else {
        console.error('[UpdateHandler] Install PowerShell execution failed or no output')
        return {
          success: false,
          error: result.error || 'Failed to execute update installation. Make sure you are running as administrator.'
        }
      }
    } catch (error) {
      console.error('Error installing updates:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async downloadUpdate(updateId) {
    console.log('Downloading update:', updateId)
    
    try {
      const script = `
# Ensure Windows Update service is running
Start-Service -Name wuauserv -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

try {
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    
    Write-Host "Searching for update..."
    $searchResult = $searcher.Search("IsInstalled=0")
    
    $updateToDownload = $null
    foreach ($update in $searchResult.Updates) {
        if ($update.Identity.UpdateID -eq "${updateId}") {
            $updateToDownload = $update
            Write-Host "Found update: $($update.Title)"
            break
        }
    }
    
    if ($null -eq $updateToDownload) {
        @{
            success = $false
            error = "Update not found"
        } | ConvertTo-Json
        return
    }
    
    $updatesToDownload = New-Object -ComObject Microsoft.Update.UpdateColl
    $updatesToDownload.Add($updateToDownload) | Out-Null
    
    Write-Host "Downloading update..."
    $downloader = $session.CreateUpdateDownloader()
    $downloader.Updates = $updatesToDownload
    $downloadResult = $downloader.Download()
    
    @{
        success = ($downloadResult.ResultCode -eq 2)
        resultCode = $downloadResult.ResultCode
        message = switch ($downloadResult.ResultCode) {
            2 { "Download completed successfully" }
            3 { "Download completed with errors" }
            4 { "Download failed" }
            default { "Download status unknown" }
        }
    } | ConvertTo-Json
} catch {
    @{
        success = $false
        error = $_.Exception.Message
    } | ConvertTo-Json
}
      `.trim()
      
      const result = await executePowerShell(null, {
        script: script,
        name: 'download-update'
      })
      
      console.log('[UpdateHandler] Download PowerShell result:', JSON.stringify(result))
      
      if (result.success && result.output) {
        try {
          // Try to find JSON in the output (PowerShell might output other text)
          const jsonMatch = result.output.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const downloadData = JSON.parse(jsonMatch[0])
            console.log('[UpdateHandler] Parsed download data:', downloadData)
            return downloadData
          } else {
            console.error('[UpdateHandler] No JSON found in download output')
            console.log('[UpdateHandler] Raw download output:', result.output)
            return {
              success: false,
              error: 'Invalid response format from Windows Update downloader'
            }
          }
        } catch (parseError) {
          console.error('[UpdateHandler] Failed to parse download result:', parseError)
          console.log('[UpdateHandler] Raw download output:', result.output)
          return {
            success: false,
            error: `Download parse error: ${parseError.message}`
          }
        }
      } else {
        console.error('[UpdateHandler] Download PowerShell execution failed or no output')
        return {
          success: false,
          error: result.error || 'Failed to execute download. Make sure you are running as administrator.'
        }
      }
    } catch (error) {
      console.error('Error downloading update:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getUpdateHistory() {
    try {
      const data = await fs.readFile(this.updateHistoryPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      return {
        lastCheck: null,
        lastInstall: null,
        installedCount: 0
      }
    }
  }

  async saveUpdateHistory(updates) {
    try {
      let history = await this.getUpdateHistory()
      history = { ...history, ...updates }
      await fs.writeFile(this.updateHistoryPath, JSON.stringify(history, null, 2))
    } catch (error) {
      console.error('Error saving update history:', error)
    }
  }

  async openUpdateHistory() {
    try {
      await execAsync('powershell Start-Process "ms-settings:windowsupdate-history"')
      return { success: true }
    } catch (error) {
      console.error('Error opening update history:', error)
      return { success: false, error: error.message }
    }
  }

  async restartWindows() {
    try {
      const script = `
shutdown /r /t 30 /c "Restarting to complete Windows updates installation"
@{ success = $true } | ConvertTo-Json
      `.trim()
      
      const result = await executePowerShell(null, {
        script: script,
        name: 'restart-windows'
      })
      
      return { success: result.success }
    } catch (error) {
      console.error('Error restarting Windows:', error)
      return { success: false, error: error.message }
    }
  }
}

export default UpdateHandler