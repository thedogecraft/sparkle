---
title: "Hide Taskview and Widgets"
---

# Hide Taskview and Widgets

## Overview

- **ID/URL**: `hide-taskview-and-widgets`
- **Description**: Hides the Taskview and Widgets buttons on the taskbar.
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Disables both the Task View button and the Widgets panel by updating the user's Explorer taskbar settings in the registry, removing the icons and preventing them from appearing on the taskbar.







## Apply

```powershell
# Hide Task View button
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowTaskViewButton" -Type DWord -Value 0

# Remove Widgets package
Get-AppxPackage *WebExperience* | Remove-AppxPackage -ErrorAction SilentlyContinue

# Restart Explorer to apply changes
Stop-Process -Name explorer -Force

Write-Host "Widgets removed and Task View hidden."


```


## Unapply

```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowTaskViewButton" -Type DWord -Value 1

Write-Host "Reinstalling Windows Widgets..."
winget install 9MSSGKG348SP --accept-source-agreements --accept-package-agreements --silent

Stop-Process -Name explorer -Force

Write-Host "Task View restored. Widgets reinstalled (may require sign-out to appear)."



```
