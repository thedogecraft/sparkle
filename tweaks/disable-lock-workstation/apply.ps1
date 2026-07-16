$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System"
if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}
Set-ItemProperty -Path $regPath -Name "DisableLockWorkstation" -Type DWord -Value 1 -Force
Write-Output "Lock disabled. Win+L, the Start menu Lock option, and Ctrl+Alt+Del Lock are now blocked."
