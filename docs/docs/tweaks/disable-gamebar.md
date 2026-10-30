---
title: "Disable Gamebar"
---

# Disable Gamebar

## Overview

- **ID/URL**: `disable-gamebar`
- **Description**: Disables The Xbox gamebar 
- **Risk Level**: <span style="color:#ff9800">Caution</span>







## Details

Attempts to remove Xbox Gaming Overlay using Remove-AppxPackage, with a fallback to winget, to eliminate background Xbox services and overlays that can consume CPU, RAM, and GPU resources, improving system performance and reducing in-game interruptions.

::: warning Documentation Warning

Do not enable this if you have a X3D cpu Example: AMD Ryzen 7 9800X3D as it allocates the 3d vcache cores to the game running. Disabling game bar stops this

:::

::: warning Tweak Warning

Do not enable this if you have a X3D cpu. read docs for more info

:::



## Apply

```powershell
try {
    winget uninstall 9nzkpstsnw4p --silent --accept-source-agreements 
        Get-AppxPackage Microsoft.XboxGamingOverlay | Remove-AppxPackage -ErrorAction Stop
      
        Write-Output 'Successfully removed Xbox Gaming Overlay via AppxPackage'
    }
    catch {
        Write-Output 'AppxPackage removal failed, trying to remove via winget'
        try {
            winget uninstall 9nzkpstsnw4p --silent --accept-source-agreements 
            Write-Output 'Successfully removed Xbox Gaming Overlay via winget'
        }
        catch {
            Write-Output 'Winget uninstall failed'
        }
    }
```


## Unapply

```powershell
winget install 9NZKPSTSNW4P --source msstore --accept-source-agreements --accept-package-agreements
```
