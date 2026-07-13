---
title: Creating Tweaks
hide:
  - navigation
---

# Tweak Guidelines

This page describes how to structure and define tweaks for the application.

---

## Directory Structure

All tweaks should follow this format:

```text
└── tweaks/
    └── example-tweak/
        ├── apply.ps1
        ├── unapply.ps1
        └── meta.json
```

!!! tip

    If the tweak does not have an unapply script, do **not** create a `unapply.ps1`. it will be changed from a toggle to an apply button in the UI

---

## `meta.json` Properties

Each tweak **must** have a `meta.json`. The available properties are:

| Property              | Type                               | Description                                                                      |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| **name**              | `string`                           | Folder name of the tweak.                                                        |
| **title**             | `string`                           | Text displayed in the UI.                                                        |
| **description**       | `string`                           | Short description shown in the UI card.                                          |
| **reversible**        | `bool` (optional, defaults `true`) | If false, the UI shows an "Apply" button instead of a toggle.                    |
| **modal**             | `string` (optional)                | Text shown in a modal before applying the tweak.                                 |
| **category**          | `string[]`                         | Used to sort tweaks in the UI.                                                   |
| **recommended**       | `bool`  (optional)                 | Shows a recommended icon in the UI.                                              |
| **top**               | `bool` (optional)                  | Places the tweak at the top of the list.                                          |
| **warning**           | `string` (optional)                | Displays an icon in the UI; hover to see the warning.                            |
| **restart**           | `bool` (optional)                  | Shows a message that a restart is required.                                      |
| **deepDescription**   | `string` (optional)                | Detailed description of the tweak; supports markdown. Used for documentation.    |
| **links**             | `object[]` (optional)              | Related resources with `name` and `url` properties.                              |
| **updatedversion**    | `string` (optional)                | Version string when the tweak was last updated. Appears in the UI.              |
| **addedversion**      | `string` (optional)                | Version string when the tweak was added. Appears in the UI.                     |
| **risk**              | `string` (optional)                | Risk level of the tweak: `safe`, `caution`, or `risky`. Shows an icon in the UI. |

---

!!! note

    `addedversion` is required for new tweaks. `updatedversion` is required when updating an existing tweak.

## Tweak Categories

Tweaks can be grouped into these categories:

- **General** — General purpose tweaks.
- **Appearance** — Changes Windows appearance.
- **Performance** — Improves system or gaming performance.
- **Privacy** — Enhances user privacy.
- **Gaming** — Optimizations for FPS, game services, or GPU settings.
- **Network** — Adjusts network settings.
- **GPU** — Modifies GPU-related settings.

---

## Example Tweak

Here's an example of a `meta.json` for a tweak:

!!! note

    This is an example and is not a real tweak or contains real links

```json
{
  "name": "disable-animations",
  "title": "Disable Animations",
  "description": "Disables Windows animations for improved performance.",
  "modal": "Disabling animations can improve performance but may reduce visual effects.",
  "category": ["Performance", "Appearance"],
  "warning": "Some apps may not display smoothly.",
  "risk": "safe",
  "restart": true,
  "recommended": true,
  "deepDescription": "Detailed description here...",
  "links": [
    {
      "name": "Microsoft Docs",
      "url": "https://docs.microsoft.com/en-us/windows/animations"
    }
  ]
}
```

---
