---
title: "Align Taskbar Left"
---

# Align Taskbar Left

## Overview

- **ID/URL**: `align-taskbar-left`
- **Description**: Aligns the taskbar to the left side of the screen.
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Forces the Windows taskbar to align left by editing the system registry. by setting the 'TaskbarAl' registry value to 0







## Apply

```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "TaskbarAl" -Type DWord -Value 0

```


## Unapply

```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "TaskbarAl" -Type DWord -Value 1

```
