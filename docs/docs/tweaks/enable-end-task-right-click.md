---
title: "Enable End Task With Right Click"
---

# Enable End Task With Right Click

## Overview

- **ID/URL**: `enable-end-task-right-click`
- **Description**: Enables the "End Task" option in the taskbar context menu
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Enables the "End Task" option in the Windows 11 taskbar right-click menu by setting TaskbarEndTask to 1, allowing users to kill unresponsive apps directly from the taskbar without opening Task Manager.





::: tip Recommended

This tweak is recommended.

:::

## Apply

```powershell
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced\TaskbarDeveloperSettings"
$valueName = "TaskbarEndTask"

if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

Set-ItemProperty -Path $regPath -Name $valueName -Type DWord -Value 1
```


## Unapply

```powershell
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced\TaskbarDeveloperSettings"
$valueName = "TaskbarEndTask"

if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

Set-ItemProperty -Path $regPath -Name $valueName -Type DWord -Value 0
```
