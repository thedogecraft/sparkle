---
title: "Set 24-Hour Clock"
---

# Set 24-Hour Clock

## Overview

- **ID/URL**: `24-hour-clock`
- **Description**: Changes clock to display 24-hour format.
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Switches Windows to a true 24-hour time format by updating the user’s regional time settings in the registry, affecting taskbar, apps, and system timestamps. IF HAVING ISSUES WITH TASKBAR, RESTART EXPLORER WITHIN SETTINGS







## Apply

```powershell
Set-ItemProperty -Path "HKCU:\Control Panel\International" -Name "sShortTime" -Value "HH:mm"
Set-ItemProperty -Path "HKCU:\Control Panel\International" -Name "sTimeFormat" -Value "HH:mm:ss"
Stop-Process -Name explorer -Force


```


## Unapply

```powershell
Set-ItemProperty -Path "HKCU:\Control Panel\International" -Name "sShortTime" -Value "h:mm tt"
Set-ItemProperty -Path "HKCU:\Control Panel\International" -Name "sTimeFormat" -Value "h:mm:ss tt"
Stop-Process -Name explorer -Force

```
