---
title: "Disable Hibernation"
---

# Disable Hibernation

## Overview

- **ID/URL**: `disable-hibernation`
- **Description**: Disables the hibernation feature to free up disk space and improve shutdown speed
- **Risk Level**: <span style="color:#ff9800">Caution</span>







## Details

Disables hibernation by turning it off at the system level with powercfg.exe, which frees up disk space by deleting hiberfil.sys and can improve shutdown speed.



::: warning Tweak Warning

Not Recommended for laptops!

:::



## Apply

```powershell
powercfg.exe /hibernate off
```


## Unapply

```powershell
powercfg.exe /hibernate on
```
