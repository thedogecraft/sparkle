---
title: "Enable HAGS"
---

# Enable HAGS

## Overview

- **ID/URL**: `enable-hags`
- **Description**: Enables HAGS (Hardware Accelerated GPU Scheduling)
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Hardware-Accelerated GPU Scheduling (HAGS) is a Windows feature that shifts more GPU management and scheduling tasks from the CPU to the GPU, reducing CPU overhead and potentially improving performance and latency







## Apply

```powershell
$regPath = "HKLM:\System\CurrentControlSet\Control\GraphicsDrivers"
$keyName = "HwSchMode"
$value = 2

If (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

Set-ItemProperty -Path $regPath -Name $keyName -Value $value -Type DWord

Write-Host "Hardware-Accelerated GPU Scheduling enabled. A restart may be required."

```


## Unapply

```powershell
$regPath = "HKLM:\System\CurrentControlSet\Control\GraphicsDrivers"
$keyName = "HwSchMode"
$value = 1

If (Test-Path $regPath) {
    Set-ItemProperty -Path $regPath -Name $keyName -Value $value -Type DWord
    Write-Host "Hardware-Accelerated GPU Scheduling disabled. A restart may be required."
}
else {
    Write-Host "Registry path not found."
}

```
