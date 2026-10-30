---
title: "Disable Dynamic Ticking"
---

# Disable Dynamic Ticking

## Overview

- **ID/URL**: `disable-dynamic-ticking`
- **Description**: Improves system responsiveness and reduces latency by disabling dynamic timer ticks.
- **Risk Level**: <span style="color:#f44336">Risky</span>







## Details

## Deep Description

- Disables Windows Dynamic Ticking by setting `disabledynamictick` to `yes` using `bcdedit`, which prevents the system timer from stopping to reduce input latency and improve responsiveness.



::: warning Tweak Warning

May increase power consumption

:::



## Apply

```powershell
try {
    bcdedit /set disabledynamictick yes
    Write-Host "Dynamic Ticking disabled successfully"
  } catch {
    Write-Host "Failed to apply Dynamic Ticking tweak"
  }
```


## Unapply

```powershell
try {
    bcdedit /set disabledynamictick no
    Write-Host "Dynamic Ticking settings restored"
  } catch {
    Write-Host "Failed to revert Dynamic Ticking tweak"
  }
```
