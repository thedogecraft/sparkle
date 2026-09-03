---
title: "What Are Tweaks?"
---



# What Are Tweaks?

Tweaks are small, targeted changes to Windows settings, registry keys, or system services that modify how your PC behaves. In Sparkle, each tweak is a self-contained PowerShell script that applies a specific optimization or customization.

---

## How Tweaks Work

Each tweak follows a simple structure:

1. **A metadata file** (`meta.json`) defines the tweak's name, description, category, risk level, and other properties.
2. **An apply script** (`apply.ps1`) contains the PowerShell commands that make the change.
3. **An optional unapply script** (`unapply.ps1`) reverses the change if the tweak is reversible.

When you toggle a tweak on in Sparkle, it runs the `apply.ps1` script. When you toggle it off, it runs `unapply.ps1`.

::: note

Some tweaks don't have an unapply script. These show an "Apply" button instead of a toggle, since the change can't be automatically reversed.
:::
---

## Categories

Tweaks are grouped into categories so you can quickly find what you need:

| Category | What it covers |
|----------|---------------|
| **General** | Broad system tweaks and common settings. |
| **Appearance** | Visual changes like dark mode, taskbar layout, and clock format. |
| **Performance** | System optimizations that improve speed and responsiveness. |
| **Privacy** | Disabling telemetry, tracking, and data collection. |
| **Gaming** | Optimizations for FPS, game services, and GPU settings. |
| **Network** | TCP/IP tuning, DNS, and network latency improvements. |
| **GPU** | Graphics driver and hardware-accelerated scheduling settings. |

---

## Risk Levels <span style="color: #ff9800;">(Sparkle 2.16.0+  Required)</span>

Every tweak has a risk level so you know what to expect:

| Risk | Icon | Meaning |
|------|------|---------|
| **Safe** | Green | Low risk. These changes are unlikely to cause problems. Most tweaks fall into this category. |
| **Caution** | Yellow | May affect system behavior or certain apps. Review the tweak description before applying. |
| **Risky** | Red | Can significantly change system behavior. Apply with care and create a restore point first. |

---

## Safety Features

Sparkle provides several safeguards when using tweaks:

- **System Restore Points** - Always create a restore point before applying tweaks. Sparkle supports this on the home page.
- **Reversible Changes** - Most tweaks can be toggled off to undo the change.
- **Modal Warnings** - Some tweaks show a confirmation dialog before applying, explaining what will change.
- **Warning Icons** - Tweaks with known side effects display a warning icon in the UI.

---



## Reapplying Tweaks <span style="color: #ff9800;">(Sparkle 2.18.0+  Required)</span>

After applying a tweak, you can force it to reapply at any time:

1. Find the tweak in the Tweaks page (it shows a toggle in the on position)
2. **Hold the Alt key** and the "Reapply" button will appear
3. Click "Reapply" to run the tweak's apply script again

This is useful if you've modified system settings manually and want the tweak to reapply its changes, or if a tweak didn't apply correctly the first time.

---

## Browsing Tweaks

You can explore all available tweaks in two ways:

- **In the app** - Open the Tweaks page to browse, search, and filter by category.
- **In the docs** - See the [All Tweaks](/tweaks) page for a full list with detailed descriptions and related links.

::: tip

Look for the <span style="color: var(--md-primary-fg-color);">&#9733; Recommended</span> icon in the app. These are tweaks that are generally safe and beneficial for most users.
:::
---

## Creating Your Own Tweaks

Sparkle's tweak system is open and extensible. If you want to create a custom tweak, see the [Creating Tweaks](/creating-tweaks) guide for the full specification and directory structure.
