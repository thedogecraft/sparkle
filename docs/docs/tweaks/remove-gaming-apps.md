---
title: "Remove Gaming Apps"
---

# Remove Gaming Apps

## Overview

- **ID/URL**: `remove-gaming-apps`
- **Description**: Removes Xbox app, Xbox Game Bar, and Xbox Game Overlay
- **Risk Level**: <span style="color:#ff9800">Caution</span>

::: info Irreversible

This tweak cannot be reversed and must be undone manually.

:::













## Apply

```powershell
$appsList = 'Microsoft.GamingApp', 'Microsoft.XboxGameOverlay', 'Microsoft.XboxGamingOverlay'

foreach ($app in $appsList) {
    Get-AppxPackage -Name $app -AllUsers | Remove-AppxPackage
    Get-AppxProvisionedPackage -Online | Where-Object DisplayName -EQ $app | Remove-AppxProvisionedPackage -Online
}

```




## Links

- [Reinstall Xbox App](https://apps.microsoft.com/detail/9mv0b5hzvk9z)
