# NOTE: Accessibility "Flags" values are REG_SZ (strings), not DWORDs, unlike
# most registry tweaks in this repo. Writing a DWORD here silently breaks them.
$path = "HKCU:\Control Panel\Accessibility\StickyKeys"
$backupPath = "HKCU:\Software\Sparkle\TweakBackup"

if (-not (Test-Path $backupPath)) { New-Item -Path $backupPath -Force | Out-Null }
$current = (Get-ItemProperty -Path $path -Name "Flags" -ErrorAction SilentlyContinue).Flags
if ($null -ne $current) {
    Set-ItemProperty -Path $backupPath -Name "StickyKeysFlags" -Type String -Value $current -Force
}

# Clear SKF_HOTKEYACTIVE (4) so pressing Shift five times does nothing, and
# SKF_CONFIRMHOTKEY (8) so the dialog can't appear. Other bits are preserved
# rather than overwritten with a hardcoded default, so any accessibility
# preferences the user already set survive.
$value = if ($null -ne $current) { [int]$current } else { 510 }
$new = $value -band (-bnot (4 -bor 8))
Set-ItemProperty -Path $path -Name "Flags" -Type String -Value ([string]$new) -Force

Write-Output "Sticky Keys shortcut disabled (Flags $value -> $new). Pressing Shift five times no longer prompts."
