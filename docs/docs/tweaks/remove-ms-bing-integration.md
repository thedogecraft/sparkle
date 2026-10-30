---
title: "Remove Microsoft Bing Integration"
---

# Remove Microsoft Bing Integration

## Overview

- **ID/URL**: `remove-ms-bing-integration`
- **Description**: Removes Bing apps and disables Bing web search in Windows Search.
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Removes all Microsoft Bing apps (News, Weather, Finance, etc.) and disables Bing web search results from appearing in Windows Search. This improves privacy and speeds up local searches.







## Apply

```powershell
# Remove all Bing apps
Get-AppxPackage *BingNews* | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxPackage *BingWeather* | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxPackage *BingFinance* | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxPackage *BingMaps* | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxPackage *BingSports* | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxPackage *BingTravel* | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxPackage *BingFoodAndDrink* | Remove-AppxPackage -ErrorAction SilentlyContinue
Get-AppxPackage *BingHealthAndFitness* | Remove-AppxPackage -ErrorAction SilentlyContinue

$searchPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search"
if (!(Test-Path $searchPath)) {
    New-Item -Path $searchPath -Force | Out-Null
}
Set-ItemProperty -Path $searchPath -Name "BingSearchEnabled" -Type DWord -Value 0
Set-ItemProperty -Path $searchPath -Name "CortanaConsent" -Type DWord -Value 0

$explorerPath = "HKCU:\Software\Policies\Microsoft\Windows\Explorer"
if (!(Test-Path $explorerPath)) {
    New-Item -Path $explorerPath -Force | Out-Null
}
Set-ItemProperty -Path $explorerPath -Name "DisableSearchBoxSuggestions" -Type DWord -Value 1

Write-Host "Bing apps removed and Bing search disabled."
```


## Unapply

```powershell
$searchPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Search"
if (Test-Path $searchPath) {
    Set-ItemProperty -Path $searchPath -Name "BingSearchEnabled" -Type DWord -Value 1
    Remove-ItemProperty -Path $searchPath -Name "CortanaConsent" -ErrorAction SilentlyContinue
}

$explorerPath = "HKCU:\Software\Policies\Microsoft\Windows\Explorer"
if (Test-Path $explorerPath) {
    Remove-ItemProperty -Path $explorerPath -Name "DisableSearchBoxSuggestions" -ErrorAction SilentlyContinue
}

Write-Host "Reinstalling Bing apps..."
winget install 9WZDNCRFHVFW --accept-source-agreements --accept-package-agreements --silent  # Bing News
winget install 9WZDNCRFJ3Q2 --accept-source-agreements --accept-package-agreements --silent  # Bing Weather

Write-Host "Bing search re-enabled. Some apps may need to be reinstalled from Microsoft Store."
```
