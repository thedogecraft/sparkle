$schemes = (powercfg /list) -split "`n" | Where-Object { $_ -match "GUID:\s*([0-9a-fA-F-]{36})" } | ForEach-Object {
    [regex]::Match($_, "GUID:\s*([0-9a-fA-F-]{36})").Groups[1].Value
}

foreach ($scheme in $schemes) {
    powercfg /setacvalueindex $scheme SUB_BUTTONS PBUTTONACTION 1
    powercfg /setdcvalueindex $scheme SUB_BUTTONS PBUTTONACTION 1
}

$activeScheme = [regex]::Match((powercfg /getactivescheme), "GUID:\s*([0-9a-fA-F-]{36})").Groups[1].Value
if ($activeScheme) {
    powercfg /setactive $activeScheme
}

Write-Output "Physical power button restored to Sleep."
