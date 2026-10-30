---
title: "Disable Core Isolation"
---

# Disable Core Isolation

## Overview

- **ID/URL**: `disable-core-isolation`
- **Description**: Disables Core Isolation Memory Integrity to improve system performance
- **Risk Level**: <span style="color:#ff9800">Caution</span>







## Details

Creates the registry path for Hypervisor-Enforced Code Integrity under DeviceGuard if missing, and disables HVCI by setting Enabled to 0 in the system-wide registry.







## Apply

```powershell
New-Item -Path "HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity" -Force | Out-Null

Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity" `
    -Name "Enabled" -Value 0 -Type DWord

```


## Unapply

```powershell
New-Item -Path "HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity" -Force | Out-Null

Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity" `
    -Name "Enabled" -Value 1 -Type DWord

```
