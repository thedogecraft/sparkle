# Disable RDP Warnings for Unsigned Files

## Overview
- **ID/URL**: `disable-rdp-warnings`
- **Description**: Suppresses Windows security warnings when opening unsigned Remote Desktop (.rdp) files.
- **Risk Level**: <span style="color:#ff9800">Caution</span>




!!! note 
    This tweak was added in 2.19.0, Sparkle 2.19.0+ is required.
  



!!! warning "Tweak Warning"
     RDP files have been abused in attacks, it is strongly recommended to keep these protections enabled..


## Apply

```powershell { .no-copy }  
$path = "HKLM:\Software\Policies\Microsoft\Windows NT\Terminal Services\Client"
if (-not (Test-Path $path)) {
    New-Item -Path $path -Force | Out-Null
}
Set-ItemProperty -Path $path -Name "RedirectionWarningDialogVersion" -Value 1 -Type DWord
Write-Host "RDP security warnings disabled."

```

## Unapply

```powershell
$path = "HKLM:\Software\Policies\Microsoft\Windows NT\Terminal Services\Client"
if (Test-Path $path) {
    if (Get-ItemProperty -Path $path -Name "RedirectionWarningDialogVersion" -ErrorAction SilentlyContinue) {
        Remove-ItemProperty -Path $path -Name "RedirectionWarningDialogVersion"
        Write-Host "RDP security warnings re-enabled."
    } else {
        Write-Host "Tweak was not applied."
    }
} else {
    Write-Host "Registry path does not exist, nothing to unapply."
}

```


## Links
- [Microsoft adds Windows protections for malicious Remote Desktop files](https://www.bleepingcomputer.com/news/microsoft/microsoft-adds-windows-protections-for-malicious-remote-desktop-files/)
