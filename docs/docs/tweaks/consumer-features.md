---
title: "Disable Consumer Features"
---

# Disable Consumer Features

## Overview

- **ID/URL**: `consumer-features`
- **Description**: Prevents Windows from automatically installing games, third-party apps, or app links from the Microsoft Store.
- **Risk Level**: <span style="color:#4caf50">Safe</span>





::: note Added Version

This tweak was added in 2.14.1, Sparkle 2.14.1+ is required.

:::

## Details

This tweak disables Windows Consumer Features, preventing automatic installation of Microsoft Store apps, games, or links. Useful for reducing bloatware and controlling which apps are installed.



::: warning Tweak Warning

Some default apps may become inaccessible.

:::



## Apply

```powershell
# Credit to Chris Titus Tech

$regPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent"
$regName = "DisableWindowsConsumerFeatures"
$applyValue = 1

if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

Set-ItemProperty -Path $regPath -Name $regName -Value $applyValue -Type DWord

Write-Host "Consumer Features disabled."
```


## Unapply

```powershell
# Credit to Chris Titus Tech

$regPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent"
$regName = "DisableWindowsConsumerFeatures"

if (Test-Path $regPath) {
    if (Get-ItemProperty -Path $regPath -Name $regName -ErrorAction SilentlyContinue) {
        Remove-ItemProperty -Path $regPath -Name $regName
        Write-Host "Consumer Features restored to default."
    } else {
        Write-Host "Tweak was not applied."
    }
} else {
    Write-Host "Registry path does not exist, nothing to unapply."
}
```
