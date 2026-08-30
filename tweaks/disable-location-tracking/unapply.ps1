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