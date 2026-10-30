---
title: "Disable Windows Recall"
---

# Disable Windows Recall

## Overview

- **ID/URL**: `disable-windows-recall`
- **Description**: Disables the Windows Recall feature for better privacy.
- **Risk Level**: <span style="color:#4caf50">Safe</span>





::: note Added Version

This tweak was added in 2.14.2, Sparkle 2.14.2+ is required.

:::

## Details

This tweak sets AllowRecallEnablement to 0 under HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsAI, disabling Windows Recall at the system level.







## Apply

```powershell
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI" -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI" -Name "AllowRecallEnablement" -Type DWord -Value 0

Start-Process "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"Write-Host 'Disabling Windows Recall...' -ForegroundColor Cyan; Write-Host 'This may take a while depending on your internet connection. Please wait...' -ForegroundColor Yellow; try { DISM /Online /Disable-Feature /FeatureName:Recall /NoRestart; Write-Host 'Windows Recall has been disabled successfully.' -ForegroundColor Green } catch { Write-Host 'Failed to disable Windows Recall.' -ForegroundColor Red }; Write-Host 'Press any key to close...'; $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')`"" -WindowStyle Normal
```


## Unapply

```powershell
Remove-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI" -Recurse -Force

Start-Process "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"Write-Host 'Re-enabling Windows Recall...' -ForegroundColor Cyan; Write-Host 'This may take a while depending on your internet connection. Please wait...' -ForegroundColor Yellow; try { DISM /Online /Enable-Feature /FeatureName:Recall /NoRestart; Write-Host 'Windows Recall has been re-enabled successfully.' -ForegroundColor Green } catch { Write-Host 'Failed to re-enable Windows Recall.' -ForegroundColor Red }; Write-Host 'Press any key to close...'; $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')`"" -WindowStyle Normal
```
