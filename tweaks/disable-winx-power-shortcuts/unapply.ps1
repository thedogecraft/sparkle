$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
if (Test-Path $regPath) {
    Set-ItemProperty -Path $regPath -Name "HidePowerShortcuts" -Type DWord -Value 0 -Force
}
Write-Output "Win+X power shortcuts restored."
