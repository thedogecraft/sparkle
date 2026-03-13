# Optimize Network Settings

## Overview
- **ID/URL**: `optimize-network-settings`
- **Description**: Changes various Windows settings to improve network latency and speeds.



!!! note 
    This tweak was last updated in 2.9.0
  

## Details

- Applies a comprehensive set of netsh TCP/IP tweaks to disable latency-inducing features, enable fast open, offload networking tasks to hardware, fine-tune congestion control, and set optimal MTU, all to maximize speed, reduce CPU load, and improve responsiveness for gaming and high-performance internet use.





## Apply

```powershell { .no-copy }  
Write-Host "Applying network tweaks..."

netsh int tcp set heuristics disabled
netsh int tcp set supplemental template=internet congestionprovider=ctcp
netsh int tcp set global rss=enabled
netsh int tcp set global ecncapability=enabled
netsh int tcp set global timestamps=disabled
netsh int tcp set global fastopen=enabled
netsh int tcp set global fastopenfallback=enabled
netsh int tcp set supplemental template=custom icw=10

Write-Host "Network tweaks applied successfully."

```

## Unapply

```powershell
Write-Host "Reverting network tweaks to defaults..."

netsh int tcp set heuristics enabled
netsh int tcp set supplemental template=internet congestionprovider=default
netsh int tcp set global rss=default
netsh int tcp set global ecncapability=default
netsh int tcp set global timestamps=default
netsh int tcp set global fastopen=default
netsh int tcp set global fastopenfallback=default
netsh int tcp set supplemental template=custom icw=4

Write-Host "Network tweaks reverted to defaults."

```
