$path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search"

if (-not (Test-Path $path)) {
    New-Item -Path $path -Force | Out-Null
}

New-ItemProperty -Path $path -Name "SearchboxTaskbarMode" -PropertyType DWord -Value 0 -Force | Out-Null

Stop-Process -Name explorer -Force
Start-Process explorer.exe