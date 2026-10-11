---
title: "Updates"
hide:
  - navigation
---

# Windows Updates

!!! note "Available in Sparkle 2.25+"

    The Updates page gives you three update modes so you can choose how aggressively Windows Update is managed on your system. Sparkle automatically detects your current mode and highlights it on the page.

After switching modes, give Windows a moment to apply the changes then it's recommended to restart your pc afterwards.

## Update Modes

- **Recommended**: Prioritizes stability while still receiving security updates.
- **Windows Default**: Restores default Windows Update behavior.
- **Disable Updates**: Blocks Windows Update completely and should only be used with extreme caution.

!!! warning "Not all Scripts may be up to date."


## Recommended

Applies a more conservative update strategy designed for most users.

- **Feature updates**: Delayed by **365 days** to <span style="color:var(--md-primary-fg-color);">reduce the chance of installing a broken windows update</span>.
- **Quality updates**: Delayed by **4 days**.
- **Drivers**: Excluded from Windows quality updates.
- **Installation**: Updates download automatically and notify you when they are ready to install.
- **Why use it**: This mode offers the best balance between security and stability, which is why it is the recommended option for most PCs To prevent installing broken Wndows updates.

```powershell
$windowsUpdatePolicyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"
$automaticUpdatePolicyPath = Join-Path $windowsUpdatePolicyPath "AU"


Remove-ItemProperty -Path $automaticUpdatePolicyPath -Name "NoAutoUpdate" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config" -Name "DODownloadMode" -ErrorAction SilentlyContinue

Set-Service -Name BITS -StartupType Manual
Set-Service -Name wuauserv -StartupType Manual
Set-Service -Name UsoSvc -StartupType Automatic
Start-Service -Name UsoSvc

$Tasks =
    '\Microsoft\Windows\InstallService\*',
    '\Microsoft\Windows\UpdateOrchestrator\*',
    '\Microsoft\Windows\UpdateAssistant\*',
    '\Microsoft\Windows\WaaSMedic\*',
    '\Microsoft\Windows\WindowsUpdate\*',
    '\Microsoft\WindowsUpdate\*'

foreach ($Task in $Tasks) {
    Get-ScheduledTask -TaskPath $Task -ErrorAction SilentlyContinue | Enable-ScheduledTask -ErrorAction SilentlyContinue
}

New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Device Metadata" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Device Metadata" -Name "PreventDeviceMetadataFromNetwork" -Type DWord -Value 1

New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Name "DontPromptForWindowsUpdate" -Type DWord -Value 1
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Name "DontSearchWindowsUpdate" -Type DWord -Value 1
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching" -Name "DriverUpdateWizardWuSearchEnabled" -Type DWord -Value 0

New-Item -Path $windowsUpdatePolicyPath -Force | Out-Null
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "ExcludeWUDriversInQualityUpdate" -Type DWord -Value 1

Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferFeatureUpdates" -Type DWord -Value 1
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferFeatureUpdatesPeriodInDays" -Type DWord -Value 365
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferQualityUpdates" -Type DWord -Value 1
Set-ItemProperty -Path $windowsUpdatePolicyPath -Name "DeferQualityUpdatesPeriodInDays" -Type DWord -Value 4

$legacySettingsPath = "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings"
foreach ($legacyValue in @("BranchReadinessLevel", "DeferFeatureUpdatesPeriodInDays", "DeferQualityUpdatesPeriodInDays")) {
    Remove-ItemProperty -Path $legacySettingsPath -Name $legacyValue -ErrorAction SilentlyContinue
}

New-Item -Path $automaticUpdatePolicyPath -Force | Out-Null
Remove-ItemProperty -Path $automaticUpdatePolicyPath -Name "NoAutoRebootWithLoggedOnUsers" -ErrorAction SilentlyContinue
Set-ItemProperty -Path $automaticUpdatePolicyPath -Name "AUOptions" -Type DWord -Value 3
Set-ItemProperty -Path $automaticUpdatePolicyPath -Name "AUPowerManagement" -Type DWord -Value 0
```

## Windows Default

- **What it does**: Removes Windows Update policies changed by Sparkle, restores update service startup settings, and re-enables update scheduled tasks.
- **Best for**: Systems where you want Windows to manage updates normally.

```powershell
$registryValues = @(
    @{
        Path  = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU"
        Names = @("NoAutoUpdate", "AUOptions", "NoAutoRebootWithLoggedOnUsers", "AUPowerManagement")
    },
    @{
        Path  = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"
        Names = @("ExcludeWUDriversInQualityUpdate", "DeferFeatureUpdates", "DeferFeatureUpdatesPeriodInDays", "DeferQualityUpdates", "DeferQualityUpdatesPeriodInDays")
    },
    @{
        Path  = "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings"
        Names = @("BranchReadinessLevel", "DeferFeatureUpdatesPeriodInDays", "DeferQualityUpdatesPeriodInDays")
    },
    @{
        Path  = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Device Metadata"
        Names = @("PreventDeviceMetadataFromNetwork")
    },
    @{
        Path  = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DriverSearching"
        Names = @("DontPromptForWindowsUpdate", "DontSearchWindowsUpdate", "DriverUpdateWizardWuSearchEnabled")
    },
    @{
        Path  = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config"
        Names = @("DODownloadMode")
    }
)

foreach ($registryEntry in $registryValues) {
    foreach ($valueName in $registryEntry.Names) {
        Remove-ItemProperty -Path $registryEntry.Path -Name $valueName -ErrorAction SilentlyContinue
    }
}

Set-Service -Name BITS -StartupType Manual
Set-Service -Name wuauserv -StartupType Manual
Set-Service -Name UsoSvc -StartupType Automatic
Start-Service -Name UsoSvc

$Tasks =
    '\Microsoft\Windows\InstallService\*',
    '\Microsoft\Windows\UpdateOrchestrator\*',
    '\Microsoft\Windows\UpdateAssistant\*',
    '\Microsoft\Windows\WaaSMedic\*',
    '\Microsoft\Windows\WindowsUpdate\*',
    '\Microsoft\WindowsUpdate\*'

foreach ($Task in $Tasks) {
    Get-ScheduledTask -TaskPath $Task -ErrorAction SilentlyContinue | Enable-ScheduledTask -ErrorAction SilentlyContinue
}
```

## Disable Updates

!!! danger "NOT RECOMMENDED!"

    - **What it does**: Disables automatic updates, stops and disables update services, disables update scheduled tasks, and clears downloaded update files.
    - **Warning**: This leaves the system without security patches and significantly increases security risk.
    - **Recommendation**: Avoid this mode unless you fully understand the tradeoffs, and security risks and have a specific reason to use it.

Sparkle asks for confirmation before applying this mode.

```powershell
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "NoAutoUpdate" -Type DWord -Value 1
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "AUOptions" -Type DWord -Value 1

New-Item -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config" -Name "DODownloadMode" -Type DWord -Value 0

foreach ($serviceName in @("BITS", "wuauserv", "UsoSvc")) {
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Set-Service -Name $serviceName -StartupType Disabled
}

Remove-Item -Path "C:\Windows\SoftwareDistribution\*" -Recurse -Force -ErrorAction SilentlyContinue

$Tasks =
    '\Microsoft\Windows\InstallService\*',
    '\Microsoft\Windows\UpdateOrchestrator\*',
    '\Microsoft\Windows\UpdateAssistant\*',
    '\Microsoft\Windows\WaaSMedic\*',
    '\Microsoft\Windows\WindowsUpdate\*',
    '\Microsoft\WindowsUpdate\*'

foreach ($Task in $Tasks) {
    Get-ScheduledTask -TaskPath $Task -ErrorAction SilentlyContinue | Disable-ScheduledTask -ErrorAction SilentlyContinue
}
```

## Detecting the Current Mode

Detection script

```powershell
$au = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU"
$wu = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"

$noAuto = (Get-ItemProperty -Path $au -Name "NoAutoUpdate" -ErrorAction SilentlyContinue).NoAutoUpdate
$defer  = (Get-ItemProperty -Path $wu -Name "DeferFeatureUpdatesPeriodInDays" -ErrorAction SilentlyContinue).DeferFeatureUpdatesPeriodInDays

if ($noAuto -eq 1) {
    Write-Output "disabled"
} elseif ($defer -eq 365) {
    Write-Output "recommended"
} else {
    Write-Output "default"
}
```



Credits to Chris Titus Tech.