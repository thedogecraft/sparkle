---
title: "Disable Windows Platform Binary Table"
---

# Disable Windows Platform Binary Table

## Overview

- **ID/URL**: `wpbt`
- **Description**: Prevents your computer vendor from executing programs at boot, reducing potential security risks.
- **Risk Level**: <span style="color:#ff9800">Caution</span>





::: note Added Version

This tweak was added in 2.14.1, Sparkle 2.14.1+ is required.

:::

## Details

Windows Platform Binary Table (WPBT) allows manufacturers to execute software each boot, including drivers or anti-theft software. Disabling WPBT improves security by blocking this mechanism.



::: warning Tweak Warning

Some vendor software may not run at startup.

:::



## Apply

```powershell
# Credit to Chris Titus Tech

$regPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager"
$regName = "DisableWpbtExecution"
$applyValue = 1

if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

Set-ItemProperty -Path $regPath -Name $regName -Value $applyValue -Type DWord

Write-Host "WPBT execution disabled."
```


## Unapply

```powershell
# Credit to Chris Titus Tech

$regPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager"
$regName = "DisableWpbtExecution"

if (Test-Path $regPath) {
    if (Get-ItemProperty -Path $regPath -Name $regName -ErrorAction SilentlyContinue) {
        Remove-ItemProperty -Path $regPath -Name $regName
        Write-Host "WPBT execution restored to default."
    } else {
        Write-Host "Tweak was not applied."
    }
} else {
    Write-Host "Registry path does not exist, nothing to unapply."
}
```
