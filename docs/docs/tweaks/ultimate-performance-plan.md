---
title: "Ultimate Performance Power Plan"
---

# Ultimate Performance Power Plan

## Overview

- **ID/URL**: `ultimate-performance-plan`
- **Description**: Enables And Applies The Windows Ultimate Powerplan for better performance
- **Risk Level**: <span style="color:#ff9800">Caution</span>







## Details

Enables the Ultimate Performance power plan by creating it if missing, retrieving its GUID, and activating it to maximize system responsiveness and performance by preventing power-saving limitations.





::: tip Recommended

This tweak is recommended.

:::

## Apply

```powershell
# powercfg prints plan names based on the users language, so matching on English names breaks on non-English Windows installs.
# This script now matches the Ultimate Performance power plan by its GUID.
$guidPattern = '[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}'
$ultimateAlias = 'e9a42b02-d5df-448d-aa00-03f14749eb61'

function Get-SchemeResourceId([string] $schemeGuid) {
  foreach ($root in @(
    'HKLM:\SYSTEM\CurrentControlSet\Control\Power\User\PowerSchemes',
    'HKCU:\Control Panel\PowerSchemes'
  )) {
    $key = Join-Path $root $schemeGuid
    if (Test-Path -LiteralPath $key) {
      $friendlyName = (Get-ItemProperty -LiteralPath $key -Name FriendlyName -ErrorAction SilentlyContinue).FriendlyName
      if ($friendlyName) {
        if ($friendlyName -match '@[^,]+,(-?\d+)') { return $Matches[1] }
        return $friendlyName
      }
    }
  }
  return $null
}

function Test-IsUltimateScheme([string] $schemeGuid) {
  if ($schemeGuid -ieq $ultimateAlias) { return $true }
  $ultimateName = Get-SchemeResourceId $ultimateAlias
  if (-not $ultimateName) { $ultimateName = '-19' }
  $schemeName = Get-SchemeResourceId $schemeGuid
  return ($null -ne $schemeName -and $schemeName -eq $ultimateName)
}

function Find-UltimateSchemeGuid {
  foreach ($line in (powercfg -list)) {
    $schemeGuid = [regex]::Match($line, $guidPattern).Value
    if ($schemeGuid -and (Test-IsUltimateScheme $schemeGuid)) { return $schemeGuid }
  }
  return $null
}

$ultimateGuid = Find-UltimateSchemeGuid

if (-not $ultimateGuid) {
  $created = powercfg -duplicatescheme $ultimateAlias 2>&1
  $ultimateGuid = [regex]::Match(($created -join [Environment]::NewLine), $guidPattern).Value
}

if (-not $ultimateGuid) {
  Write-Error 'Could not find or create the Ultimate Performance power plan.'
  exit 1
}

powercfg /setactive $ultimateGuid
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Ultimate Performance power plan is now active.'

```


## Unapply

```powershell
$balancedGUID = "381b4222-f694-41f0-9685-ff5bb260df2e"
  
  # check if the Balanced plan exists
  $balancedExists = powercfg -l | Select-String $balancedGUID
  
  if ($balancedExists) {
      powercfg -setactive $balancedGUID
      Write-Host "Balanced power plan is now active." 
  } else {
      Write-Host "Balanced power plan not found. Creating a new Balanced plan..." 
      powercfg -duplicatescheme $balancedGUID
      powercfg -setactive $balancedGUID
      Write-Host "Balanced power plan created and activated." 
  }
```
