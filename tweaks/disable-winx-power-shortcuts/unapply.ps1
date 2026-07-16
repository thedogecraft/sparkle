$regPaths = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer"
)
foreach ($regPath in $regPaths) {
    if (Test-Path $regPath) {
        Remove-ItemProperty -Path $regPath -Name "HidePowerOptions" -Force -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $regPath -Name "StartMenuLogOff" -Force -ErrorAction SilentlyContinue
    }
}
Stop-Process -Name explorer -Force
Start-Process explorer.exe
Write-Output "Win+X power shortcuts restored."
