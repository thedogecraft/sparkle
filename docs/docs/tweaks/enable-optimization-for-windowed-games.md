---
title: "Enable Optimization For Windowed Games"
---

# Enable Optimization For Windowed Games

## Overview

- **ID/URL**: `enable-optimization-for-windowed-games`
- **Description**: Enables Optimization For Windowed Games on windows
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Enables Optimization For Windowed Games on Windows







## Apply

```powershell

$regPath = "HKCU:\Software\Microsoft\DirectX\UserGpuPreferences"
$keyName = "DirectXUserGlobalSettings"
$value = "SwapEffectUpgradeEnable=1;"

If (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

Set-ItemProperty -Path $regPath -Name $keyName -Value $value

Write-Host "DirectX game optimization applied."

```


## Unapply

```powershell
$regPath = "HKCU:\Software\Microsoft\DirectX\UserGpuPreferences"
$keyName = "DirectXUserGlobalSettings"

If (Test-Path "$regPath\$keyName") {
    Remove-ItemProperty -Path $regPath -Name $keyName -ErrorAction SilentlyContinue
    Write-Host "DirectX game optimization removed."
}
else {
    Write-Host "Registry key does not exist, nothing to remove."
}

```
