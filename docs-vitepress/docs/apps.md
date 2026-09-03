---
title: "Apps"
hide:
  - navigation
---

# Apps Page

The **Apps Page** is a comprehensive app installer that supports both **Winget** and **Chocolatey** package managers to install or uninstall applications on your system.

## Features

### Package Manager Support

Sparkle supports two package managers:

- **Winget** - Windows Package Manager (default)
- **Chocolatey** - Community package manager

You can switch between them using the **Select Source** dropdown. The page will automatically detect if your selected package manager is installed and offer to install it if missing.

### Search and Categories

The Apps page displays over 100+ applications organized into categories:

- **Browsers** - Firefox, Chrome, Brave, Opera, Vivaldi, Tor Browser, Zen Browser, and more
- **Communication** - Discord, Slack, Teams, Telegram, Zoom, Signal, Vesktop
- **Development** - VS Code, Visual Studio, Git, GitHub Desktop, Node.js, Docker, Python, Rust, Go
- **Games** - Steam, Epic Games, EA App, Battle.net, Minecraft Launcher, Playnite, Modrinth
- **Multimedia** - Spotify, VLC, OBS Studio, Audacity, Krita, ShareX, FxSound
- **Productivity** - Notion, Dropbox, Microsoft Office, Blender
- **Privacy & Security** - VPN services (Surfshark, NordVPN, Proton VPN, Mullvad), Bitwarden, Malwarebytes
- **Utilities** - 7-Zip, PowerToys, Rufus, MSI Afterburner, Everything Search, and many more
- **Python** - Multiple Python versions (3.8 through 3.13)

Use the search bar to quickly find apps by name.

### Install and Uninstall

1. Select apps by clicking on them or using the checkbox
2. Click **Install Selected** to install
3. Click **Uninstall Selected** to remove apps

The Install/Uninstall status is in the titlebar.

### Export and Import

You can export your selected apps list to share or backup:

- **Export List** - Downloads a JSON file with your selected apps
- **Import List** - Import a previously exported JSON file to select those apps

## App Cards

Each app displays:

- App icon
- App name
- Description
- Package ID
- External link button to open the app's website

Some apps may show a warning if they have known installation issues when running as admin.

## Contributing New Apps

To add new apps to the installer, edit the `apps.json` file located at:

```
src/renderer/assets/apps.json
```

Each app entry has the following structure:

```json
{
  "name": "App Name",
  "id": "Publisher.AppName",
  "chocolatey": "package-name",
  "category": "category-name",
  "info": "Short description of the app.",
  "link": "https://example.com",
  "icon": "https://example.com/icon.png"
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name of the app |
| `id` | Yes* | Winget package ID |
| `chocolatey` | No | Chocolatey package name |
| `category` | Yes | Category for grouping (e.g., "browsers", "development") |
| `info` | Yes | Short description shown on the app card |
| `link` | No | Website URL (opens in external link) |
| `icon` | Yes | URL to the app's icon image |
| `warning` | No | Optional warning message displayed to users |

*Required for Winget source. Some apps may only have a Chocolatey package.

After editing, submit a pull request on [GitHub](https://github.com/parcoil/sparkle).