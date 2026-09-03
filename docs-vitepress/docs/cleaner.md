---
title: Cleaner
hide:
  - navigation
---

# Sparkle Cleaner

The Sparkle Cleaner helps free up disk space and remove unnecessary system files.

## 1. Clean Temporary Files

Removes both system and user temporary files.

```powershell
$systemTemp = "$env:SystemRoot\\Temp"
$userTemp = [System.IO.Path]::GetTempPath()
$foldersToClean = @($systemTemp, $userTemp)
$totalSizeBefore = 0

foreach ($folder in $foldersToClean) {
    if (Test-Path $folder) {
        $folderSize = (Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        $totalSizeBefore += if ($folderSize) { $folderSize } else { 0 }
        Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Output $totalSizeBefore
```

## 2. Clean Prefetch Files

Deletes files from the Windows Prefetch folder.

```powershell
$prefetch = "$env:SystemRoot\\Prefetch"
$totalSizeBefore = 0
if (Test-Path $prefetch) {
    $totalSizeBefore = (Get-ChildItem -Path "$prefetch\\*" -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    Remove-Item "$prefetch\\*" -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Output $totalSizeBefore
```

## 3. Empty Recycle Bin

Permanently removes files from the Recycle Bin.

```powershell
$recycleBinSize = 0
$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(0xA)
$recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Output $recycleBinSize
```

## 4. Clean Windows Update Cache

Removes downloaded Windows Update installation files.

```powershell
$windowsUpdateDownload = "$env:SystemRoot\\SoftwareDistribution\\Download"
$totalSizeBefore = 0
if (Test-Path $windowsUpdateDownload) {
    $totalSizeBefore = (Get-ChildItem -Path "$windowsUpdateDownload\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    Remove-Item "$windowsUpdateDownload\\*" -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Output $totalSizeBefore
```

## 5. Clear Thumbnail Cache

Removes cached thumbnail images used by File Explorer.

```powershell
$thumbCache = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer"
$totalSizeBefore = 0
$thumbFiles = Get-ChildItem "$thumbCache\\thumbcache_*.db" -ErrorAction SilentlyContinue
if ($thumbFiles) {
    $totalSizeBefore = ($thumbFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    Remove-Item "$thumbCache\\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
}
Write-Output $totalSizeBefore
```

## 6. Clear Error Reports

Removes error report and crash dump files.

```powershell
$crashDumps = "$env:LOCALAPPDATA\\CrashDumps"
$totalSizeBefore = 0
if (Test-Path $crashDumps) {
    $totalSizeBefore = (Get-ChildItem -Path "$crashDumps\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    Remove-Item "$crashDumps\\*" -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Output $totalSizeBefore
```