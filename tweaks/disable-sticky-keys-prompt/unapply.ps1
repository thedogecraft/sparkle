# Mirrors apply.ps1. Restores the exact Flags value apply.ps1 recorded, so a
# user who had already customised Sticky Keys keeps their own setting instead
# of being reset to the Windows default.
$path = "HKCU:\Control Panel\Accessibility\StickyKeys"
$backupPath = "HKCU:\Software\Sparkle\TweakBackup"

$backup = (Get-ItemProperty -Path $backupPath -Name "StickyKeysFlags" -ErrorAction SilentlyContinue).StickyKeysFlags
if ($null -ne $backup) {
    Set-ItemProperty -Path $path -Name "Flags" -Type String -Value ([string]$backup) -Force
    Remove-ItemProperty -Path $backupPath -Name "StickyKeysFlags" -ErrorAction SilentlyContinue
    Write-Output "Sticky Keys restored to its previous setting (Flags $backup)."
} else {
    # No backup: fall back to 510, the Windows default (hotkey on, confirm on).
    Set-ItemProperty -Path $path -Name "Flags" -Type String -Value "510" -Force
    Write-Output "Sticky Keys restored to the Windows default (Flags 510)."
}
