$regPaths = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer"
)
foreach ($regPath in $regPaths) {
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
    }
    Set-ItemProperty -Path $regPath -Name "HidePowerOptions" -Type DWord -Value 1 -Force
    Set-ItemProperty -Path $regPath -Name "StartMenuLogOff" -Type DWord -Value 1 -Force
}
Stop-Process -Name explorer -Force
Start-Process explorer.exe
Write-Output "Win+X power shortcuts disabled."
