# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sparkle is a Windows-only Electron + React + TypeScript desktop app that debloats and optimizes Windows (tweaks, a system cleaner, a DNS manager, a bulk app installer, and restore-point backup/revert).

The app always runs elevated (`requestedExecutionLevel: requireAdministrator` in `package.json`), since most tweaks and utilities require admin rights.

## Commands

Package manager is **pnpm** (`packageManager: pnpm@10.29.3` in `package.json`) — don't use npm/yarn, mixing package managers here has caused broken installs before.

```
pnpm install              # install deps
pnpm dev                  # electron-vite dev with hot reload (main + preload + renderer)
pnpm typecheck             # both of the below
pnpm typecheck:node        # tsc --noEmit against tsconfig.node.json (main + preload)
pnpm typecheck:web         # tsc --noEmit against tsconfig.web.json (renderer)
pnpm test                  # vitest run (all tests, once)
pnpm test:watch            # vitest watch mode
pnpm exec vitest run src/main/__tests__/gpu.test.ts   # run a single test file
pnpm exec eslint .         # lint (not wired into package.json scripts or CI, but the config is real and CI-worthy)
pnpm format                # prettier --write .
pnpm build:vite             # electron-vite build only (main+preload+renderer to out/)
pnpm build:electron         # build:vite, then electron-builder (produces installer/zip in dist/)
pnpm build                  # node build.js — prompts interactively ("update tweak registry?") before building; avoid in non-interactive contexts, use build:vite/build:electron instead
pnpm test:smoke              # scripts/smoke-test.mjs — launches the built dist/win-unpacked exe and checks it stays alive
```

CI (`.github/workflows/ci.yml`, runs on `windows-latest`) does: `pnpm typecheck` → `pnpm test` → `pnpm build:vite` → `electron-builder --dir` → `pnpm test:smoke`. It does not currently run eslint.

Tests live in `src/main/__tests__/` and only cover main-process logic (vitest, `environment: "node"`, path aliases `@main` → `src/main`, `@` → `src/renderer/src`, see `vitest.config.ts`). There is no renderer/component test coverage.

## Architecture

### Three-process layout and path aliases

Standard Electron split, built by `electron-vite` (config: `electron.vite.config.mjs`):

- `src/main/` — main process. Entry point `src/main/index.ts` creates the `BrowserWindow` and calls each domain's `setupXHandlers()` (see below). Alias `@main` → `src/main/`.
- `src/preload/index.ts` — **the actual preload script** (bundles to `out/preload/index.mjs`, loaded via `webPreferences.preload` in `index.ts`). It wraps `@electron-toolkit/preload`'s `electronAPI` and gates `ipcRenderer.invoke`/`.send` behind an explicit `INVOKABLE_CHANNELS`/`SENDABLE_CHANNELS` allowlist — **any new `ipcMain.handle`/`ipcMain.on` channel must be added to this allowlist or the renderer won't be able to call it.** Note: `src/main/preload.ts` also exists but is dead code, never referenced by any build entry or `webPreferences.preload` path — don't edit it expecting it to do anything.
- `src/renderer/src/` — the React app. Aliases `@` and `@renderer` both → `src/renderer/src/`, `@main` also resolves here (for type-only imports from main, not for running main-process code in the renderer).

### IPC pattern

Each main-process domain file (`backup.ts`, `debloat.ts`, `dnsHandler.ts`, `powershell.ts`, `system.ts`, `tweakHandler.ts`, `updates.ts`, plus a few handlers inline in `index.ts`) exports a `setupXHandlers()` that registers its `ipcMain.handle(...)` channels, and a matching `cleanupXHandlers()` that removes them. `index.ts` calls every `setupXHandlers()` once on `app.whenReady()`.

Renderer code never calls `ipcRenderer` directly except through `src/renderer/src/lib/electron.ts`'s `invoke({ channel, payload })` helper (a thin wrapper over `window.electron.ipcRenderer.invoke`). When adding a new IPC channel: register it with `ipcMain.handle` in the relevant main-process file, add the channel name to `INVOKABLE_CHANNELS` in `src/preload/index.ts`, then call it from the renderer via `invoke({ channel: "..." })`.

### Tweaks system

Each tweak is a folder under `tweaks/<name>/` containing `meta.json`, `apply.ps1`, and `unapply.ps1`. `src/main/tweakHandler.ts`'s `loadTweaks()` reads these **directly off disk at runtime** (`process.cwd()/tweaks` in dev, `app.getAppPath()/tweaks` when packaged) — the app does not read from any bundled/generated registry. `tweak:apply`/`tweak:unapply` IPC handlers look up the tweak by folder name and execute its `.ps1` script content via `executePowerShell`. Toggle state (which tweaks are currently "on") is tracked client-side in `tweakStates.json` under the Electron `userData` folder — it's just a UI bookkeeping file, not a live query of actual system state, so it can drift from reality if a tweak's scripts are edited/fixed after being applied once.

`tweaks/registry.json` and `tweaks/registry-scripts.json` are a **separate, generated artifact** (built by `buildRegistry()` in `build.js`, which prompts interactively) used for the external docs site / registry consumers — they are not read by the app itself. If you edit a tweak's `meta.json`/`apply.ps1`/`unapply.ps1`, these two JSON files will go stale until `buildRegistry()` (or an equivalent non-interactive regeneration) is re-run; this has caused confusion before because the app's actual behavior only ever depends on the files inside `tweaks/<name>/`, never on these generated JSON files.

When writing or fixing a tweak's PowerShell: verify the registry path/value you're setting is a real, documented Windows setting before trusting a script that "looks plausible" — this codebase has had multiple tweaks that silently no-op because they wrote to a registry value that doesn't exist (e.g. `HidePowerShortcuts` instead of the real `HidePowerOptions`, or `CrashControl\Value` instead of `CrashControl\DisplayParameters`). Also make sure `apply.ps1` and `unapply.ps1` are true inverses of each other — drift between the two (one script listing more/different values than the other) has been a repeated source of bugs, particularly in tweaks with large per-service or per-registry-key tables.

Some Windows shell settings apply differently depending on whether they're written to `HKCU` vs `HKLM` (e.g. the Win+X power menu specifically requires `HKLM`, not just `HKCU`, to actually hide the "Shut down or sign out" submenu) — don't assume `HKCU` alone is sufficient just because a setting is described as "per-user."

### Theming

All theme colors are CSS custom properties defined in `src/renderer/src/App.css` under `@theme` / per-class blocks (`:root` = dark/default, `.light`, `.purple`, `.gray`, `.classic`), all named `--color-sparkle-*` and consumed as Tailwind v4 utility classes (e.g. `text-sparkle-text`, `border-sparkle-border`). `src/renderer/src/pages/Settings.tsx` toggles theme by adding one of these class names to `document.body`. When adding new themed UI, use the existing `--color-sparkle-*` tokens rather than hardcoded colors so all five themes stay consistent.

### Other notes

- Native module rebuilds are disabled (`npmRebuild: false` in `package.json` build config) — `postinstall` runs `electron-builder install-app-deps` instead.
- The app is unsigned (no code-signing cert configured), so packaged builds trigger SmartScreen warnings — this is expected for local/dev builds, not a build failure.
- `resources/` holds bundled binaries used by tweaks/utilities (e.g. `nvidiaProfileInspector.exe`, `sparklenvidia.nip`) — these are referenced by path from main-process code (`getExePath`/`getNipPath` in `tweakHandler.ts`), with different resolution logic for dev (`process.cwd()/resources`) vs packaged (`process.resourcesPath`).
- `docs/` is a separate MkDocs documentation site, excluded from ESLint and from the packaged app's `files` list — don't expect changes there to affect the app itself.
