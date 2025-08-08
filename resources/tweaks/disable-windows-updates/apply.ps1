# Disable Windows Update service
Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
Set-Service -Name wuauserv -StartupType Disabled

# Disable Update Orchestrator Service
Stop-Service -Name UsoSvc -Force -ErrorAction SilentlyContinue
Set-Service -Name UsoSvc -StartupType Disabled

# Disable Windows Update Medic Service
Stop-Service -Name WaaSMedicSvc -Force -ErrorAction SilentlyContinue
sc.exe config WaaSMedicSvc start=disabled

# Disable automatic updates via registry
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows" -Name "WindowsUpdate" -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" -Name "AU" -Force -ErrorAction SilentlyContinue | Out-Null

# Disable automatic updates
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoUpdate" -Type DWord -Value 1 -Force

# Disable automatic restart after updates
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoRebootWithLoggedOnUsers" -Type DWord -Value 1 -Force

# Disable automatic driver updates
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DriverSearching" -Name "SearchOrderConfig" -Type DWord -Value 0 -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" -Name "ExcludeWUDriversInQualityUpdate" -Type DWord -Value 1 -Force

# Disable Windows Update notifications
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer" -Force -ErrorAction SilentlyContinue | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer" -Name "DisableNotificationCenter" -Type DWord -Value 0 -Force

Write-Host "Windows Updates have been disabled" -ForegroundColor Green
Write-Host "You can manually check for updates from the Updates page in Sparkle" -ForegroundColor Yellow