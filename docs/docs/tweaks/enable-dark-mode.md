---
title: "Enable Dark Mode"
---

# Enable Dark Mode

## Overview

- **ID/URL**: `enable-dark-mode`
- **Description**: Enables dark mode for Windows. Great for unactivated systems.
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Enables dark mode for system UI and apps by setting theme values to 0, then restarts Explorer to apply the change - also works on unactivated Windows systems where personalization settings are normally locked.







## Apply

```powershell
$Path = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize"
Set-ItemProperty -Path $Path -Name AppsUseLightTheme -Value 0
Set-ItemProperty -Path $Path -Name SystemUsesLightTheme -Value 0
Stop-Process -Name explorer -Force
Start-Process explorer.exe

```


## Unapply

```powershell
$Path = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize"
Set-ItemProperty -Path $Path -Name AppsUseLightTheme -Value 1
Set-ItemProperty -Path $Path -Name SystemUsesLightTheme -Value 1
Stop-Process -Name explorer -Force
Start-Process explorer.exe

```
