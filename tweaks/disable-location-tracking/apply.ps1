$locationPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location"
if (-not (Test-Path $locationPath)) { New-Item -Path $locationPath -Force | Out-Null }
Set-ItemProperty -Path $locationPath -Name "Value" -Value "Deny" -Type String -Force

$telemetryPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection"
if (-not (Test-Path $telemetryPath)) { New-Item -Path $telemetryPath -Force | Out-Null }
Set-ItemProperty -Path $telemetryPath -Name "AllowTelemetry" -Value 0 -Type DWord -Force

Set-Service -Name DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue

$auPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU"
if (-not (Test-Path $auPath)) { New-Item -Path $auPath -Force | Out-Null }
Set-ItemProperty -Path $auPath -Name "NoAutoUpdate" -Value 1 -Type DWord -Force

Write-Output "Location tracking, telemetry, diagnostics tracking, and automatic updates disabled."
