---
title: "Utilities"
hide:
  - navigation
---

# Utilities Page

::: tip Comprehensive System Utilities

  The Utilities page provides direct access to system maintenance tools and settings management with intuitive controls. All utilities run PowerShell scripts behind the scenes and sync with your Windows configuration.
:::
## Overview

The Utilities page offers 14 different system utilities. Each utility automatically detects your current system settings and provides appropriate controls - toggles, buttons, or dropdowns - to manage Windows features and perform maintenance tasks.

## Available Utilities

| Utility | Description | Control Type |
|---------|-------------|--------------|
| **Disk Cleaner** | Free up space by removing unnecessary files. | Button - "Clean Now" |
| **Storage Sense** | Automatically free up space by getting rid of files you don't need. | Toggle |
| **System Information** | View detailed information about your system. | Button - "View Info" |
| **Fast Startup** | Improve boot times by optimizing startup settings. | Toggle |
| **Windows Updates** | Control how Windows handles automatic updates. | Dropdown - [Default, Manual, Disabled] |
| **Graphics Driver** | Restart your graphics driver to fix display issues. | Button - "Restart" |
| **Power Plan** | Choose how your computer manages power and performance. | Dropdown - [Balanced, High Performance, Power Saver, Ultimate Performance] |
| **Flush DNS Cache** | Fix connection issues by clearing DNS resolver cache. | Button - "Flush" |
| **System File Checker** | Repair corrupted system files to improve stability. | Button - "Repair" |
| **DISM Health Restore** | Use DISM to repair the Windows image and fix system issues. | Button - "Repair" |
| **Check Disk** | Check and fix disk errors on your system. | Button - "Check" |
| **Restart Audio Service** | Fix sound issues by restarting Windows Audio. | Button - "Restart" |
| **Network Reset** | Reset your network stack to fix connectivity problems. | Button - "Reset" |
| **Windows Search and UI** | Restart Windows Search and UI to fix display issues. | Button - "Restart" |

## How It Works

- **Toggle**: Enable/disable features with a switch. Automatically detects current state.
- **Button**: Execute one-time actions like cleaning, repairing, or restarting services.
- **Dropdown**: Choose from multiple options for settings with more than two states.

All utilities automatically check your current system settings on page load and show toast notifications for success/failure. PowerShell scripts run in the background to apply changes.
