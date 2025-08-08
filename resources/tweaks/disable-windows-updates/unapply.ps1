# Enable Windows Update service
Set-Service -Name wuauserv -StartupType Manual
Start-Service -Name wuauserv -ErrorAction SilentlyContinue

# Enable Update Orchestrator Service
Set-Service -Name UsoSvc -StartupType Manual
Start-Service -Name UsoSvc -ErrorAction SilentlyContinue

# Enable Windows Update Medic Service
sc.exe config WaaSMedicSvc start=manual
Start-Service -Name WaaSMedicSvc -ErrorAction SilentlyContinue

# Remove registry settings
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoUpdate" -Force -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoRebootWithLoggedOnUsers" -Force -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DriverSearching" -Name "SearchOrderConfig" -Force -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" -Name "ExcludeWUDriversInQualityUpdate" -Force -ErrorAction SilentlyContinue

Write-Host "Windows Updates have been re-enabled" -ForegroundColor Green