---
title: "Show Seconds in Taskbar Clock"
---

# Show Seconds in Taskbar Clock

## Overview

- **ID/URL**: `show-seconds-in-taskbar-clock`
- **Description**: Enables the seconds next to the clock in the taskbar
- **Risk Level**: <span style="color:#4caf50">Safe</span>















## Apply

```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowSecondsInSystemClock" -Type DWord -Value 1

# Restart Explorer to apply changes
Stop-Process -Name explorer -Force
Start-Process explorer

```


## Unapply

```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowSecondsInSystemClock" -Type DWord -Value 0

# Restart Explorer to apply changes
Stop-Process -Name explorer -Force
Start-Process explorer

```
