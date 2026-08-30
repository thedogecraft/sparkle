# Disable Telemetry

## Overview
- **ID/URL**: `disable-telemetry`
- **Description**: Disables Windows telemetry and data collection for improved privacy and performance.
- **Risk Level**: <span style="color:#4caf50">Safe</span>



!!! note 
    This tweak was last updated in 2.21.1
  
!!! note 
    This tweak was added in 2.14.0, Sparkle 2.14.0+ is required.
  
## Details

- Disables Windows telemetry by modifying registry keys to prevent data collection and reporting to ~~Microsoft~~ Microslop. This tweak was previously in sparkle but was removed issues with the tweak not applying correctly. It has been re-added.



!!! tip "Recommended"
    This tweak is recommended.


## Apply

```powershell { .no-copy }  
# Registry tweaks
$registrySettings = @(
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo"; Name="Enabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy"; Name="TailoredExperiencesWithDiagnosticDataEnabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Speech_OneCore\Settings\OnlineSpeechPrivacy"; Name="HasAccepted"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Input\TIPC"; Name="Enabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\InputPersonalization"; Name="RestrictImplicitInkCollection"; Value=1 },
    @{ Path="HKCU:\Software\Microsoft\InputPersonalization"; Name="RestrictImplicitTextCollection"; Value=1 },
    @{ Path="HKCU:\Software\Microsoft\InputPersonalization\TrainedDataStore"; Name="HarvestContacts"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Personalization\Settings"; Name="AcceptedPrivacyPolicy"; Value=0 },
    @{ Path="HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection"; Name="AllowTelemetry"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; Name="Start_TrackProgs"; Value=0 },
    @{ Path="HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"; Name="PublishUserActivities"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Siuf\Rules"; Name="NumberOfSIUFInPeriod"; Value=0 }
)

foreach ($reg in $registrySettings) {
    New-Item -Path $reg.Path -Force | Out-Null
    Set-ItemProperty -Path $reg.Path -Name $reg.Name -Value $reg.Value -Type DWord
}

# Disable Defender Auto Sample Submission
Set-MpPreference -SubmitSamplesConsent 2

# Disable Connected User Experiences and Telemetry service
Set-Service -Name diagtrack -StartupType Disabled

# Disable Windows Error Reporting Manager service
Set-Service -Name wermgr -StartupType Disabled

# Set SvcHostSplitThresholdInKB to total RAM in KB (this can help with performance)
$MemoryKB = (Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum / 1KB
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control" -Name "SvcHostSplitThresholdInKB" -Value [int]$MemoryKB

# Remove PeriodInNanoSeconds key if exists
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Siuf\Rules" -Name "PeriodInNanoSeconds" -ErrorAction SilentlyContinue

Write-Output "Telemetry settings have been applied. Bye Bye Microslop"
```

## Unapply

```powershell

# Registry cleanup (removes entries we added)
$registrySettings = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo\Enabled",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy\TailoredExperiencesWithDiagnosticDataEnabled",
    "HKCU:\Software\Microsoft\Speech_OneCore\Settings\OnlineSpeechPrivacy\HasAccepted",
    "HKCU:\Software\Microsoft\Input\TIPC\Enabled",
    "HKCU:\Software\Microsoft\InputPersonalization\RestrictImplicitInkCollection",
    "HKCU:\Software\Microsoft\InputPersonalization\RestrictImplicitTextCollection",
    "HKCU:\Software\Microsoft\InputPersonalization\TrainedDataStore\HarvestContacts",
    "HKCU:\Software\Microsoft\Personalization\Settings\AcceptedPrivacyPolicy",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection\AllowTelemetry",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced\Start_TrackProgs",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System\PublishUserActivities",
    "HKCU:\Software\Microsoft\Siuf\Rules\NumberOfSIUFInPeriod"
)

foreach ($reg in $registrySettings) {
    Remove-ItemProperty -Path ($reg -replace '\\[^\\]+$','') -Name ($reg -split '\\')[-1] -ErrorAction SilentlyContinue
}

# Enable Defender Auto Sample Submission
Set-MpPreference -SubmitSamplesConsent 1

# Enable Connected User Experiences and Telemetry service
Set-Service -Name diagtrack -StartupType Automatic

# Enable Windows Error Reporting Manager service
Set-Service -Name wermgr -StartupType Automatic

# Reset SvcHostSplitThresholdInKB to default value
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control" -Name "SvcHostSplitThresholdInKB" -Value 399360 -Type DWord

Write-Output "Telemetry settings have been reverted to default."
```
