---
title: "Set PowerShell 7 as Default"
---

# Set PowerShell 7 as Default

## Overview

- **ID/URL**: `set-powershell7-default`
- **Description**: Sets PowerShell 7 as the default profile in Windows Terminal (installs PS7 if missing)
- **Risk Level**: <span style="color:#4caf50">Safe</span>















## Apply

```powershell
if (Test-Path -Path "$env:ProgramFiles\PowerShell\7") {
    Write-Host "PowerShell 7 is already installed."
} else {
    Write-Host "Installing PowerShell 7..."
    winget install --id Microsoft.PowerShell --silent
}

$targetTerminalName = "PowerShell"

if (-not (Get-Command "wt" -ErrorAction SilentlyContinue)) {
    Write-Host "Windows Terminal not installed. Exiting..."
    exit
}

$settingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
if (-not (Test-Path -Path $settingsPath)) {
    Write-Host "Windows Terminal settings.json not found."
    exit
}

$settingsContent = Get-Content -Path $settingsPath | ConvertFrom-Json
$ps7Profile = $settingsContent.profiles.list | Where-Object { $_.name -eq $targetTerminalName }

if ($ps7Profile) {
    $settingsContent.defaultProfile = $ps7Profile.guid
    $settingsContent | ConvertTo-Json -Depth 100 | Set-Content -Path $settingsPath
    Write-Host "Default profile set to PowerShell 7"
} else {
    Write-Host "No PowerShell 7 profile found."
}

```


## Unapply

```powershell
$targetTerminalName = "Windows PowerShell"

if (-not (Get-Command "wt" -ErrorAction SilentlyContinue)) {
    Write-Host "Windows Terminal not installed. Exiting..."
    exit
}

$settingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
if (-not (Test-Path -Path $settingsPath)) {
    Write-Host "Windows Terminal settings.json not found."
    exit
}

$settingsContent = Get-Content -Path $settingsPath | ConvertFrom-Json
$ps5Profile = $settingsContent.profiles.list | Where-Object { $_.name -eq $targetTerminalName }

if ($ps5Profile) {
    $settingsContent.defaultProfile = $ps5Profile.guid
    $settingsContent | ConvertTo-Json -Depth 100 | Set-Content -Path $settingsPath
    Write-Host "Default profile reverted to PowerShell 5"
} else {
    Write-Host "No Windows PowerShell profile found."
}

```
