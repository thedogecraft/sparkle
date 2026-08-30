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
    @{ Path="HKCU:\Software\Microsoft\Siuf\Rules"; Name="NumberOfSIUFInPeriod"; Value=0 },

    # disable windows Error Reporting
    @{ Path="HKLM:\Software\Policies\Microsoft\Windows\Windows Error Reporting"; Name="Disabled"; Value=1 },
    @{ Path="HKLM:\SOFTWARE\Microsoft\Windows\Windows Error Reporting"; Name="Disabled"; Value=1 },
    @{ Path="HKLM:\SOFTWARE\Microsoft\Windows\Windows Error Reporting"; Name="DontSendAdditionalData"; Value=1 },
    @{ Path="HKLM:\SOFTWARE\Microsoft\Windows\Windows Error Reporting"; Name="LoggingDisabled"; Value=1 },
    @{ Path="HKLM:\Software\Microsoft\Windows\Windows Error Reporting\Consent"; Name="DefaultConsent"; Value=0 },
    @{ Path="HKLM:\Software\Microsoft\Windows\Windows Error Reporting\Consent"; Name="DefaultOverrideBehavior"; Value=1 },

    # disable start menu tile suggestions and ads
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="ContentDeliveryAllowed"; Value=0 },
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="SubscribedContentEnabled"; Value=0 },
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="OemPreInstalledAppsEnabled"; Value=0 },
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="PreInstalledAppsEnabled"; Value=0 },
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="PreInstalledAppsEverEnabled"; Value=0 },
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="SilentInstalledAppsEnabled"; Value=0 },
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="SystemPaneSuggestionsEnabled"; Value=0 },
    @{ Path="HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="FeatureManagementEnabled"; Value=0 }
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