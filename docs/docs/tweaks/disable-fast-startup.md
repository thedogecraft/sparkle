---
title: "Disable Fast Startup"
---

# Disable Fast Startup

## Overview

- **ID/URL**: `disable-fast-startup`
- **Description**: Disables Windows Fast Startup to improve system stability
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Disables Windows Fast Startup by setting HiberbootEnabled to 0, preventing the system from using hybrid hibernation during shutdown for a full clean boot.







## Apply

```powershell
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power' -Name HiberbootEnabled -Value 0
```


## Unapply

```powershell
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power' -Name HiberbootEnabled -Value 1
```
