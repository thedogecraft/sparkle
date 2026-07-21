$path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
$backupPath = "HKCU:\Software\Sparkle\TweakBackup"

# Restore the value recorded by apply.ps1. Falls back to 1 (the Windows
# default: hide extensions) only if no backup exists.
$backup = (Get-ItemProperty -Path $backupPath -Name "HideFileExt" -ErrorAction SilentlyContinue).HideFileExt
if ($null -ne $backup) {
    Set-ItemProperty -Path $path -Name "HideFileExt" -Type DWord -Value $backup -Force
    Remove-ItemProperty -Path $backupPath -Name "HideFileExt" -ErrorAction SilentlyContinue
} else {
    Set-ItemProperty -Path $path -Name "HideFileExt" -Type DWord -Value 1 -Force
}

Stop-Process -Name explorer -Force
Start-Process explorer

Write-Output "File extension visibility restored."
