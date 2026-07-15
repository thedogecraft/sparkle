$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}
Set-ItemProperty -Path $regPath -Name "HidePowerShortcuts" -Type DWord -Value 1 -Force
Write-Output "Win+X power shortcuts disabled."
