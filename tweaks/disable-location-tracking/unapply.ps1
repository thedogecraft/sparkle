$locationPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location"
if (Test-Path $locationPath) {
    Set-ItemProperty -Path $locationPath -Name "Value" -Value "Allow" -Type String -Force
}

Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue

Set-Service -Name DiagTrack -StartupType Automatic -ErrorAction SilentlyContinue

Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoUpdate" -ErrorAction SilentlyContinue

Write-Output "Location tracking, telemetry, diagnostics tracking, and automatic updates restored to defaults."
