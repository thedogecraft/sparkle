$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System"
if (Test-Path $regPath) {
    Remove-ItemProperty -Path $regPath -Name "DisableLockWorkstation" -Force -ErrorAction SilentlyContinue
}
Write-Output "Lock restored. Win+L and the Lock options work again."
