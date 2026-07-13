---
title: Contributing
hide:
  - navigation
---

# Contributing to Sparkle

Thank you for your interest in contributing to Sparkle! This guide covers the different ways you can help improve the project.

## Ways to Contribute

### Reporting Issues

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/parcoil/sparkle/issues).

When reporting bugs, include:

- Sparkle version
- Windows version
- Log file (Located at C:\\Users\\YOUR_USER\\AppData\\Roaming\\sparkle\\logs)
- Steps to reproduce
- Expected vs actual behavior

### Pull Requests

We welcome pull requests. To get started:

1. Fork the [repository](https://github.com/parcoil/sparkle)
2. Create a new branch for your changes
3. Make your changes and test them
4. Submit a pull request with a clear description

## Adding New Apps

You can add new applications to the Sparkle app installer by editing the `apps.json` file.

See the full guide: [Contributing New Apps](/apps/#contributing-new-apps)

## Creating Tweaks

Want to add a new tweak? Tweaks use PowerShell scripts and a `meta.json` configuration file.

See the full guide: [Creating Tweaks](/creating-tweaks/)

## Development Setup

To run Sparkle locally you need:

- **Node.js** v22+ and **pnpm**
- **.NET 10 SDK** or higher ([download](https://dotnet.microsoft.com/download))
- **Windows 10/11**

```bash
# Clone the repository
git clone https://github.com/parcoil/sparkle.git
cd sparkle

# Install dependencies
pnpm install

# Start development mode (Admin Recomended. Some things only work with admin)
pnpm dev
```

### Building the Sidecar

Sparkle uses a C# sidecar (`SparkleSidecar.exe`) for all system-level operations. To build it:

```bash
# Build the sidecar only
pnpm build:sidecar

# Build everything (sidecar + registry + electron)
pnpm build:all
```

The sidecar is a self-contained .NET 10 executable that runs as a child process of the Electron main process. Communication happens over stdin/stdout using newline-delimited JSON.

### Build Commands

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start in development mode with hot reload |
| `pnpm build` | Full build (sidecar + registry + electron) |
| `pnpm build:sidecar` | Build only the C# sidecar |
| `pnpm build:registry` | Regenerate tweak registry JSON files |
| `pnpm build:electron` | Build only the Electron app |
| `pnpm build:all` | Build sidecar, registry, and Electron |

## Architecture

Sparkle uses a **two-process architecture**:

- **Electron (Node.js)** - Handles the UI (React), window management, auto-updates, and reads tweak definitions from the asar archive.
- **C# Sidecar** - A self-contained .NET 10 executable (`SparkleSidecar.exe`) that handles all system- operations such as executing tweak scripts, DNS management, backup/restore points, app installation, and system information.

The Electron main process communicates with the C# sidecar over **stdin/stdout**

## Community

- [GitHub Repository](https://github.com/parcoil/sparkle)
- [Discord Server](https://discord.com/invite/En5YJYWj3Z)
