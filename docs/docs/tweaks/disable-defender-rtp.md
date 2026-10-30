---
title: "Disable Defender RTP"
---

# Disable Defender RTP

## Overview

- **ID/URL**: `disable-defender-rtp`
- **Description**: Disables Defender Real-time Protection
- **Risk Level**: <span style="color:#f44336">Risky</span>







## Details

Sets the Defender policy DisableRealtimeMonitoring to true, instructing Windows Security to stop actively scanning files and processes in real time. For better performance







## Apply

```powershell
Set-MpPreference -DisableRealtimeMonitoring $true
```


## Unapply

```powershell
Set-MpPreference -DisableRealtimeMonitoring $false
```
