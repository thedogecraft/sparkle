---
title: "Disable Copilot"
---

# Disable Copilot

## Overview

- **ID/URL**: `disable-copilot`
- **Description**: Removes Microsoft's Copilot feature. (will fail if copilot is not installed)
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Finds and removes all installed Microsoft Copilot-related AppX packages for all users by filtering package names with 'Microsoft.Copilot'





::: tip Recommended

This tweak is recommended.

:::

## Apply

```powershell
Get-AppxPackage -AllUsers | Where-Object {$_.Name -Like '*Microsoft.Copilot*'} | Remove-AppxPackage -ErrorAction Continue
```


## Unapply

```powershell
winget install 9NHT9RB2F4HD --source msstore --accept-source-agreements --accept-package-agreements
```
