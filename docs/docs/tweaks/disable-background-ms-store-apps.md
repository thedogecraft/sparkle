---
title: "Disable Background MS Store apps"
---

# Disable Background MS Store apps

## Overview

- **ID/URL**: `disable-background-ms-store-apps`
- **Description**: Disables Microsoft Store apps from running in the background
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Disables all background activity for modern UWP apps by setting 'GlobalUserDisabled' to 1 under the current user's BackgroundAccessApplications registry key, creating the key if it doesn't exist.







## Apply

```powershell
$path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications"
$name = "GlobalUserDisabled"
$newValue = 1
  
# Ensure the key exists
If (-Not (Test-Path $path)) {
  New-Item -Path $path -Force | Out-Null
}
  
# Set the value
Set-ItemProperty -Path $path -Name $name -Type DWord -Value $newValue
  
Write-Host "$name set to $newValue (Background Access Disabled)"
```


## Unapply

```powershell
 $path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications"
  $name = "GlobalUserDisabled"
  $originalValue = 0
  
  # Ensure the key exists
  If (-Not (Test-Path $path)) {
      New-Item -Path $path -Force | Out-Null
  }
  
  # Revert the value
  Set-ItemProperty -Path $path -Name $name -Type DWord -Value $originalValue
  
  Write-Host "$name reverted to $originalValue (Background Access Restored)" -ForegroundColor Yellow
```
