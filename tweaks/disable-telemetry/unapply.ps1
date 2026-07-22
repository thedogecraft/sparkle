
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