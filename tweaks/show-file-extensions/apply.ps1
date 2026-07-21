$path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
$backupPath = "HKCU:\Software\Sparkle\TweakBackup"

# Record the pre-existing value so unapply can restore what the user actually
# had, rather than assuming the Windows default. Absent means "was default".
if (-not (Test-Path $backupPath)) { New-Item -Path $backupPath -Force | Out-Null }
$current = (Get-ItemProperty -Path $path -Name "HideFileExt" -ErrorAction SilentlyContinue).HideFileExt
if ($null -ne $current) {
    Set-ItemProperty -Path $backupPath -Name "HideFileExt" -Type DWord -Value $current -Force
}

Set-ItemProperty -Path $path -Name "HideFileExt" -Type DWord -Value 0 -Force

Stop-Process -Name explorer -Force
Start-Process explorer

Write-Output "File extensions are now shown for known file types."
