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
$ultimatePlan = powercfg -l | Select-String "Ultimate Performance"
  
  if (-not $ultimatePlan) {
      Write-Host "Ultimate Performance plan not found. Creating..." 
      powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61
  } else {
      Write-Host "Ultimate Performance plan already exists." 
  }
  
  # Get the GUID of the Ultimate Performance plan
  $ultimatePlanGUID = (powercfg -l | Select-String "Ultimate Performance").ToString().Split()[3]
  
  # Set it as the active plan
  powercfg -setactive $ultimatePlanGUID
  
  Write-Host "Ultimate Performance power plan is now active." 
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
