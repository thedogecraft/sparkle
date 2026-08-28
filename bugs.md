# Bugs

## Resolved

### 1. Failed tweak apply/unapply is reported as success

`src/renderer/src/pages/Tweaks.tsx:152`

~~`executePowerShell` never throws; it returns `{ success: false, error }`. But `applyTweak`, `applyNonReversibleTweak`, `forceReapplyTweak`, the modal "Apply" button, and `applyRecommendedTweaks` all await `invoke(...)` and discard the result. So a tweak whose script actually fails is saved as "applied" and shows a success toast.~~

**Fixed:** apply paths now check `result?.success` and surface the error on failure.

### 2. Tray/window icons broken in production

`src/main/index.ts:84`, `src/main/tray.ts:5`

~~`resources/sparkle2.ico` is excluded from the asar (`!resources/**` in `package.json:127`) and the `extraResources` filter only copies `*.exe`, `*.nip`, `*.pow` (`package.json:90-93`). So the ico is not packaged at all, and `path.join(__dirname, "../../resources/...")` points inside the asar.~~

**Fixed:** added `*.ico` to the `extraResources` filter and both `index.ts`/`tray.ts` now resolve via the shared `getResourcePath` helper (`src/main/utils.ts`), which uses `process.resourcesPath` when packaged.

## High Impact

## High Impact

### 3. exec maxBuffer too small for large output

`src/main/powershell.ts:35`

`execPromise` uses the 1MB default `maxBuffer`. `winget list` (used by `check-installed`) and the installed-apps JSON can exceed this, causing the whole promise to reject → "Failed to check installed apps" and empty Debloat+ list.

**Fix:** pass `{ maxBuffer: 10 * 1024 * 1024 }`.

### 4. Restore points sort broken

`src/renderer/src/pages/Backup.tsx:65`

`runPowerShell` (`backup.ts:13`) uses Windows PowerShell 5.1, whose `ConvertTo-Json` serializes `CreationTime` as `"\/Date(1690000000000)\/"`. The parser slices it as `yyyyMMddHHmmss`, producing `NaN` for every point → sorting is meaningless.

**Fix:** format `CreationTime` in the main process or parse the `/Date(...)/` form.

### 5. RPC enable/disable race

`src/main/rpc.ts:28`

`startDiscordRPC` delays client creation by 1s via `setTimeout`. If the user toggles RPC off within that window, `stopDiscordRPC` no-ops (`rpcClient` is still null) and the client logs in anyway 1s later.

### 6. Offline detection depends on a third-party API

`src/renderer/src/store/online.ts:16`

It pings `jsonplaceholder.typicode.com` every 5s; if that site is slow/down you get a false "You're Offline" and DNS/Apps tabs get disabled.

**Consider:** `navigator.onLine` + a DNS-level check instead.

## Minor

- `src/main/dnsHandler.ts:288` — ping result containing `TTL=` means the ping succeeded, but it's classified as "timeout". The `Average` regex also assumes English ping output.
- `src/main/powershell.ts:283` — `check-installed` matches app IDs with `\b` regex against `winget list` text; easy false positives (e.g. `steam` matches `Steam Link`). Prefer `winget list --id <id>` or the JSON output.
- `src/main/index.ts:124` — `app.commandLine.appendSwitch("no-sandbox")` runs in production too; weakens security for no benefit here.
- `src/main/index.ts:99` — `setWindowOpenHandler` calls `shell.openExternal(details.url)` for any URL; validate `http:`/`https:` first.
- `src/main/powershell.ts:31` — the `name` prop is interpolated into a temp filename with no sanitization (path traversal risk if a future caller passes an unsafe name).
- `src/main/tweakHandler.ts:178` — `tweak:apply` returns a plain string for the NVIDIA tweak but an object for others; inconsistent return shape the renderer relies on.
- `src/renderer/src/pages/Settings.tsx:420` — tray toggle says "Requires restart," but `tray:set` (`index.ts:33`) creates/destroys the tray live.
- `src/main/dnsHandler.ts:172` — DNS is applied to all active adapters including virtual ones (WSL/Hyper-V/VPN).
- `build.js:98` — uses `crypto.subtle` without importing `crypto` (works only via Node's global `webcrypto`; fragile).

## Feature Improvements

- Surface the actual PowerShell error to the user on tweak/utility failures instead of a generic "Failed to apply" toast (the `error` field already exists in the response).
- Per-adapter DNS selection instead of blanket-apply; add IPv6 support to `sanitizeIP`.
- Debloat+ batch uninstall: prompt to create a restore point before a multi-app uninstall (like the FirstTime flow).
- Show `CreationTime` in the restore-points table (currently only Description is displayed).
- Serialize the 6 concurrent size-check PowerShell processes on the Clean page mount (`Clean.tsx:204`).
- Guard against concurrent `autoUpdater.checkForUpdates()` calls (`updates.ts:77`) — a manual check during the 5-min interval check can throw.
- Consider lazy-loading (`lazy()`) the heavy pages (Apps, Debloat) — they render eagerly in `App.tsx`.
