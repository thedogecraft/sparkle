---
title: "Enable Game Mode"
---

# Enable Game Mode

## Overview

- **ID/URL**: `enable-game-mode`
- **Description**: Enables Game Mode on windows
- **Risk Level**: <span style="color:#4caf50">Safe</span>







## Details

Enables the game mode feature on windows to improve performance and reduce latency. altough it not all users see a performance boost or may even cause worse performance. its recommended to test with and without to see if it works for you.







## Apply

```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\GameBar" -Name "AllowAutoGameMode" -Value 1
Set-ItemProperty -Path "HKCU:\Software\Microsoft\GameBar" -Name "AutoGameModeEnabled" -Value 1

Write-Output "Game Mode is now ENABLED."

```


## Unapply

```powershell
Set-ItemProperty -Path "HKCU:\Software\Microsoft\GameBar" -Name "AllowAutoGameMode" -Value 0
Set-ItemProperty -Path "HKCU:\Software\Microsoft\GameBar" -Name "AutoGameModeEnabled" -Value 0

Write-Output "Game Mode is now DISABLED."

```


## Links

- [Game Mode (Microsoft)](https://support.xbox.com/en-US/help/games-apps/game-setup-and-play/use-game-mode-gaming-on-pc)
