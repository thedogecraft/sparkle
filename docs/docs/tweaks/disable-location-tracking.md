# Disable Location Tracking

## Overview
- **ID/URL**: `disable-location-tracking`
- **Description**: Disables Windows location tracking.
- **Risk Level**: <span style="color:#4caf50">Safe</span>



!!! note 
    This tweak was last updated in 2.21.1
  

## Details

- Disables location access (including the Location service and sensor permissions) and telemetry data collection (including the DiagTrack service) by setting the relevant registry policies, reducing background data collection and giving you more control over the system.



!!! tip "Recommended"
    This tweak is recommended.


## Apply

```powershell { .no-copy }  
$path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection"
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "AllowTelemetry" -Value 0 -Type DWord -Force

Stop-Service -Name "DiagTrack" -Force -ErrorAction SilentlyContinue
Set-Service -Name "DiagTrack" -StartupType Disabled -ErrorAction SilentlyContinue

$path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location"
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "Value" -Value "Deny" -Type String -Force

$path = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Sensor\Overrides\{BFA794E4-F964-4FDB-90F6-51056BFE4B44}"
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "SensorPermissionState" -Value 0 -Type DWord -Force

Stop-Service -Name "lfsvc" -Force -ErrorAction SilentlyContinue
Set-Service -Name "lfsvc" -StartupType Disabled -ErrorAction SilentlyContinue
```

## Unapply

```powershell
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue

Set-Service -Name "DiagTrack" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "DiagTrack" -ErrorAction SilentlyContinue

$path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location"
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "Value" -Value "Allow" -Type String -Force

$path = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Sensor\Overrides\{BFA794E4-F964-4FDB-90F6-51056BFE4B44}"
if (Test-Path $path) {
    Set-ItemProperty -Path $path -Name "SensorPermissionState" -Value 1 -Type DWord -Force
}

Set-Service -Name "lfsvc" -StartupType Manual -ErrorAction SilentlyContinue
Start-Service -Name "lfsvc" -ErrorAction SilentlyContinue
```
