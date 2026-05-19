export const REGISTRY_CLEANER_SCRIPT = String.raw`
$ErrorActionPreference = "Continue"

if (-not (Get-PSDrive -Name HKCR -ErrorAction SilentlyContinue)) {
    New-PSDrive -Name HKCR -PSProvider Registry -Root HKEY_CLASSES_ROOT -ErrorAction SilentlyContinue | Out-Null
}

$SelectedScans = @(
    "SharedDLLs",
    "Ext",
    "FileExts",
    "ActiveX",
    "TypeLib",
    "AppPaths",
    "Apps",
    "Installer",
    "Uninstall",
    "Startup",
    "Icons",
    "ProgIDs",
    "Services",
    "MuiCache",
    "AppCompat",
    "Firewall"
)

$findings = [System.Collections.ArrayList]::new()
$scanErrors = [System.Collections.ArrayList]::new()

function Add-ScanError {
    param(
        [string]$Category,
        [string]$Message
    )

    [void]$script:scanErrors.Add(("{0}: {1}" -f $Category, $Message))
}

function Add-Finding {
    param(
        [string]$Problem,
        [string]$Data,
        [string]$DisplayKey,
        [string]$RegPath,
        $ValueName,
        [string]$Type
    )

    [void]$script:findings.Add([PSCustomObject]@{
        Problem    = $Problem
        Data       = $Data
        DisplayKey = $DisplayKey
        RegPath    = $RegPath
        ValueName  = $ValueName
        Type       = $Type
    })
}

function Test-ContainsPathPlaceholder {
    param($Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }

    return (
        $Path -match "%[A-Za-z0-9_]+%" -or
        $Path -match "%\d+" -or
        $Path -match "\$\(.*\)"
    )
}

function Test-PathExists {
    param($Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }

    $expandedPath = [Environment]::ExpandEnvironmentVariables($Path)

    if ($Path -match "%\d+" -or $expandedPath -match '[<>\|"]') {
        return $true
    }

    try {
        if (Test-Path -LiteralPath $expandedPath -ErrorAction Stop) { return $true }
    }
    catch {}

    if (Test-ContainsPathPlaceholder $Path) { return $true }

    if ($Path -match "(?i)System32") {
        $nativePath = $expandedPath -replace "(?i)System32", "Sysnative"
        try {
            if (Test-Path -LiteralPath $nativePath -ErrorAction Stop) { return $true }
        }
        catch {}
    }

    return $false
}

function Test-IsWhitelisted {
    param($Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }

    $safeList = @(
        "TetheringSettingHandler",
        "CrossDevice",
        "Windows.Media.Protection",
        "psmachine",
        "WebView2",
        "System.Data.dll",
        "System.EnterpriseServices",
        "rundll32",
        "explorer.exe",
        "svchost",
        "dllhost",
        "wmiprvse",
        "mmgaserver",
        "pickerhost",
        "castsrv",
        "uihelper",
        "backgroundtaskhost",
        "smartscreen",
        "runtimebroker",
        "mousocoreworker",
        "spatialaudiolicensesrv",
        "speechruntime",
        "mstsc.exe",
        "searchprotocolhost",
        "AppX",
        "WindowsApps",
        "UIEOrchestrator",
        "control.exe",
        "sdclt.exe",
        "provtool.exe",
        "perfmon",
        "Diagnostic.Perfmon",
        "QuickActionsPS",
        "VailAudioProxy"
    )

    foreach ($safe in $safeList) {
        if ($Path.IndexOf($safe, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return $true
        }
    }

    return $false
}

function Get-RealExePath {
    param($RawString)

    if ([string]::IsNullOrWhiteSpace($RawString)) { return $null }

    $clean = $RawString.Trim()
    if ($clean -match "^(.*?),\s*-?\d+$") { $clean = $matches[1].Trim() }

    if ($clean.StartsWith('"')) {
        $endQuote = $clean.IndexOf('"', 1)
        if ($endQuote -gt 1) {
            $quotedPart = $clean.Substring(1, $endQuote - 1)
            if (Test-PathExists $quotedPart) { return $quotedPart }
            $clean = $quotedPart
        }
    }

    $expandedClean = [Environment]::ExpandEnvironmentVariables($clean)
    if ($expandedClean -match '^\s*(?<Path>[a-zA-Z]:\\.+?\.(?:exe|dll|ocx|cpl|bat|cmd|com|msc|ico))(?=$|[\s,])') {
        $candidatePath = $matches.Path.Trim()
        if (Test-PathExists $candidatePath) { return $candidatePath }
    }

    if (-not (Test-ContainsPathPlaceholder $clean) -and (Test-PathExists $clean)) {
        return $clean
    }

    if ($clean.Contains(" ")) {
        $parts = $clean -split " "
        $candidate = $parts[0]
        $check = {
            param($PathToCheck)

            if (Test-PathExists $PathToCheck) { return $true }
            if (Test-PathExists "$PathToCheck.exe") { return $true }
            return $false
        }

        if (& $check $candidate) { return $candidate }

        for ($i = 1; $i -lt $parts.Count; $i++) {
            $candidate += " " + $parts[$i]
            if (& $check $candidate) { return $candidate }
        }
    }

    return $clean
}

function Test-IsRegistryFlagEnabled {
    param($Value)

    if ($null -eq $Value) { return $false }

    try {
        return ([int]$Value -eq 1)
    }
    catch {
        return ([string]$Value -eq "1")
    }
}

function Test-IsWindowsInstallerCommand {
    param($RawString)

    if ([string]::IsNullOrWhiteSpace($RawString)) { return $false }

    $expanded = [Environment]::ExpandEnvironmentVariables($RawString.Trim())
    return ($expanded -match '(?i)(^|[\\/"\s])msiexec(\.exe)?(?=$|[\s/"])')
}

function Get-UninstallExecutablePath {
    param($RawString)

    if ([string]::IsNullOrWhiteSpace($RawString)) { return $null }

    $cmd = [Environment]::ExpandEnvironmentVariables($RawString.Trim())
    if ([string]::IsNullOrWhiteSpace($cmd) -or (Test-IsWindowsInstallerCommand $cmd)) {
        return $null
    }

    $candidate = $null
    if ($cmd -match '^\s*"([^"]+)"') {
        $candidate = $matches[1].Trim()
    }
    elseif ($cmd -match '^\s*(?<Path>[a-zA-Z]:\\.+?\.(?:exe|msi|cmd|bat|com))(?=$|\s)') {
        $candidate = $matches.Path.Trim()
    }
    elseif ($cmd -match '^\s*(?<Path>[a-zA-Z]:\\[^\s]+)') {
        $candidate = $matches.Path.Trim()
    }

    if ([string]::IsNullOrWhiteSpace($candidate)) { return $null }

    $candidate = [Environment]::ExpandEnvironmentVariables($candidate)
    if ($candidate -notmatch '^[a-zA-Z]:\\') { return $null }
    if (Test-ContainsPathPlaceholder $candidate) { return $null }

    return $candidate
}

function Convert-SparkleRegistryPath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $null }

    $normalized = $Path.Trim()
    $normalized = $normalized -replace "^Registry::", ""
    $normalized = $normalized -replace "^HKEY_LOCAL_MACHINE\\", "HKLM:\"
    $normalized = $normalized -replace "^HKEY_CURRENT_USER\\", "HKCU:\"
    $normalized = $normalized -replace "^HKEY_CLASSES_ROOT\\", "HKCR:\"

    if ($normalized -notmatch '^(?<Hive>HKLM|HKCU|HKCR):\\(?<SubPath>.*)$') {
        return $null
    }

    $hive = switch ($Matches.Hive) {
        "HKLM" { [Microsoft.Win32.RegistryHive]::LocalMachine }
        "HKCU" { [Microsoft.Win32.RegistryHive]::CurrentUser }
        "HKCR" { [Microsoft.Win32.RegistryHive]::ClassesRoot }
    }

    [PSCustomObject]@{
        Hive    = $hive
        Root    = $Matches.Hive
        SubPath = $Matches.SubPath
    }
}

function Convert-SparkleRegistryPathToRegExePath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $null }

    $normalized = $Path.Trim()
    $normalized = $normalized -replace "^Registry::", ""
    $normalized = $normalized -replace "^HKLM:?\\", "HKEY_LOCAL_MACHINE\"
    $normalized = $normalized -replace "^HKCU:?\\", "HKEY_CURRENT_USER\"
    $normalized = $normalized -replace "^HKCR:?\\", "HKEY_CLASSES_ROOT\"

    return $normalized
}

function Test-SparkleRegistryValueExists {
    param(
        [string]$Path,
        [string]$ValueName
    )

    if ([string]::IsNullOrWhiteSpace($Path) -or $null -eq $ValueName) {
        return $false
    }

    $parts = Convert-SparkleRegistryPath -Path $Path
    if (-not $parts) { return $false }

    $baseKey = $null
    $key = $null

    try {
        $baseKey = [Microsoft.Win32.RegistryKey]::OpenBaseKey($parts.Hive, [Microsoft.Win32.RegistryView]::Default)
        $key = $baseKey.OpenSubKey($parts.SubPath, $false)
        if ($key) {
            return ($key.GetValueNames() -contains $ValueName)
        }
    }
    catch {}
    finally {
        if ($key) { $key.Close() }
        if ($baseKey) { $baseKey.Close() }
    }

    return $false
}

function Remove-SparkleRegistryValueNative {
    param(
        [string]$Path,
        [string]$ValueName
    )

    if ([string]::IsNullOrWhiteSpace($Path) -or $null -eq $ValueName) {
        return $false
    }

    $parts = Convert-SparkleRegistryPath -Path $Path
    if (-not $parts) { return $false }

    $baseKey = $null
    $key = $null

    try {
        $baseKey = [Microsoft.Win32.RegistryKey]::OpenBaseKey($parts.Hive, [Microsoft.Win32.RegistryView]::Default)
        $key = $baseKey.OpenSubKey($parts.SubPath, $true)
        if ($key) {
            $key.DeleteValue($ValueName, $false)
            $key.Close()
            $key = $null
            if (-not (Test-SparkleRegistryValueExists -Path $Path -ValueName $ValueName)) {
                return $true
            }
        }
    }
    catch {}
    finally {
        if ($key) { $key.Close() }
        if ($baseKey) { $baseKey.Close() }
    }

    return $false
}

function Remove-SparkleRegistryValueRegExe {
    param(
        [string]$Path,
        [string]$ValueName
    )

    if ([string]::IsNullOrWhiteSpace($Path) -or $null -eq $ValueName) {
        return $false
    }

    $regPath = Convert-SparkleRegistryPathToRegExePath -Path $Path
    if ([string]::IsNullOrWhiteSpace($regPath)) { return $false }

    try {
        & reg.exe delete $regPath /v $ValueName /f 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0 -or -not (Test-SparkleRegistryValueExists -Path $Path -ValueName $ValueName)) {
            return $true
        }
    }
    catch {}

    return (-not (Test-SparkleRegistryValueExists -Path $Path -ValueName $ValueName))
}

if (-not ([System.Management.Automation.PSTypeName]'SparkleWin32.TokenManipulator').Type) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class SparkleWin32 {
    public class TokenManipulator {
        [DllImport("advapi32.dll", ExactSpelling = true, SetLastError = true)]
        internal static extern bool AdjustTokenPrivileges(IntPtr htok, bool disall, ref TokPriv1Luid newst, int len, IntPtr prev, IntPtr relen);

        [DllImport("kernel32.dll", ExactSpelling = true)]
        internal static extern IntPtr GetCurrentProcess();

        [DllImport("advapi32.dll", ExactSpelling = true, SetLastError = true)]
        internal static extern bool OpenProcessToken(IntPtr h, int acc, ref IntPtr phtok);

        [DllImport("advapi32.dll", SetLastError = true)]
        internal static extern bool LookupPrivilegeValue(string host, string name, ref long pluid);

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        internal struct TokPriv1Luid {
            public int Count;
            public long Luid;
            public int Attr;
        }

        internal const int SE_PRIVILEGE_ENABLED = 0x00000002;
        internal const int TOKEN_ADJUST_PRIVILEGES = 0x00000020;
        internal const int TOKEN_QUERY = 0x00000008;

        public static bool EnablePrivilege(string privilege) {
            try {
                IntPtr htok = IntPtr.Zero;
                if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, ref htok)) return false;
                TokPriv1Luid tp;
                tp.Count = 1;
                tp.Attr = SE_PRIVILEGE_ENABLED;
                tp.Luid = 0;
                if (!LookupPrivilegeValue(null, privilege, ref tp.Luid)) return false;
                if (!AdjustTokenPrivileges(htok, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero)) return false;
                return true;
            } catch {
                return false;
            }
        }
    }
}
"@ -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
}

try {
    [SparkleWin32.TokenManipulator]::EnablePrivilege("SeTakeOwnershipPrivilege") | Out-Null
    [SparkleWin32.TokenManipulator]::EnablePrivilege("SeRestorePrivilege") | Out-Null
}
catch {}

function Remove-RegKeyForced {
    param(
        [string]$Path,
        [bool]$IsKey,
        $ValName
    )

    if ($Path -match "^HKEY_CLASSES_ROOT") { $Path = $Path -replace "^HKEY_CLASSES_ROOT", "HKCR:" }
    if ($Path -match "^HKEY_LOCAL_MACHINE") { $Path = $Path -replace "^HKEY_LOCAL_MACHINE", "HKLM:" }
    if ($Path -match "^HKEY_CURRENT_USER") { $Path = $Path -replace "^HKEY_CURRENT_USER", "HKCU:" }

    $realPaths = @()
    if ($Path -match "^HKLM" -or $Path -match "^HKCU") {
        $realPaths += $Path
    }
    elseif ($Path -match "^HKCR:\\(?<SubPath>.*)") {
        $sub = $Matches.SubPath
        if (Test-Path "HKLM:\SOFTWARE\Classes\$sub") { $realPaths += "HKLM:\SOFTWARE\Classes\$sub" }
        if (Test-Path "HKLM:\SOFTWARE\WOW6432Node\Classes\$sub") { $realPaths += "HKLM:\SOFTWARE\WOW6432Node\Classes\$sub" }
        if (Test-Path "HKCU:\Software\Classes\$sub") { $realPaths += "HKCU:\Software\Classes\$sub" }
    }

    if ($realPaths.Count -eq 0) { $realPaths += $Path }

    $globalSuccess = $true
    $literalValueName = if ($null -ne $ValName) {
        [System.Management.Automation.WildcardPattern]::Escape([string]$ValName)
    }
    else {
        $ValName
    }

    foreach ($targetPath in $realPaths) {
        try {
            if ($IsKey) {
                Remove-Item -LiteralPath $targetPath -Recurse -Force -ErrorAction Stop
            }
            else {
                [void](Remove-SparkleRegistryValueNative -Path $targetPath -ValueName $ValName)
                if (Test-SparkleRegistryValueExists -Path $targetPath -ValueName $ValName) {
                    try {
                        Remove-ItemProperty -LiteralPath $targetPath -Name $literalValueName -ErrorAction Stop
                    }
                    catch {}
                }
                if (Test-SparkleRegistryValueExists -Path $targetPath -ValueName $ValName) {
                    throw "Registry value still exists after native removal."
                }
            }

            continue
        }
        catch {}

        try {
            $sid = New-Object System.Security.Principal.SecurityIdentifier([System.Security.Principal.WellKnownSidType]::BuiltinAdministratorsSid, $null)
            $adminUser = $sid.Translate([System.Security.Principal.NTAccount])
            $rule = New-Object System.Security.AccessControl.RegistryAccessRule($adminUser, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")

            $unlockItem = {
                param($Target)

                try {
                    $acl = Get-Acl $Target
                    $acl.SetOwner($adminUser)
                    Set-Acl $Target $acl -ErrorAction SilentlyContinue
                    $acl = Get-Acl $Target
                    $acl.SetAccessRule($rule)
                    Set-Acl $Target $acl -ErrorAction SilentlyContinue
                }
                catch {}
            }

            if ($IsKey) {
                $children = Get-ChildItem -LiteralPath $targetPath -Recurse -ErrorAction SilentlyContinue
                foreach ($child in $children) { & $unlockItem -Target $child.PSPath }
            }

            & $unlockItem -Target $targetPath

            if ($IsKey) {
                Remove-Item -LiteralPath $targetPath -Recurse -Force -ErrorAction Stop
            }
            else {
                [void](Remove-SparkleRegistryValueNative -Path $targetPath -ValueName $ValName)
                if (Test-SparkleRegistryValueExists -Path $targetPath -ValueName $ValName) {
                    try {
                        Remove-ItemProperty -LiteralPath $targetPath -Name $literalValueName -ErrorAction Stop
                    }
                    catch {}
                }
                if (Test-SparkleRegistryValueExists -Path $targetPath -ValueName $ValName) {
                    [void](Remove-SparkleRegistryValueRegExe -Path $targetPath -ValueName $ValName)
                }
                if (Test-SparkleRegistryValueExists -Path $targetPath -ValueName $ValName) {
                    throw "Registry value still exists after forced removal."
                }
            }
        }
        catch {
            $globalSuccess = $false
        }
    }

    return $globalSuccess
}

function Backup-RegKey {
    param(
        $ItemObj,
        [string]$FilePath
    )

    $regKeyPath = Convert-SparkleRegistryPathToRegExePath -Path $ItemObj.RegPath
    if ([string]::IsNullOrWhiteSpace($regKeyPath)) { return }

    $tmpFile = Join-Path ([System.IO.Path]::GetTempPath()) ("Sparkle_RegBackup_{0}.reg" -f ([guid]::NewGuid().ToString("N")))

    try {
        & reg.exe export $regKeyPath $tmpFile /y 2>$null | Out-Null
        if (Test-Path -LiteralPath $tmpFile) {
            $content = Get-Content -LiteralPath $tmpFile -Raw -Encoding Unicode
            $content = $content -replace "^\uFEFF?Windows Registry Editor Version 5\.00\r?\n\r?\n", ""
            if (-not [string]::IsNullOrWhiteSpace($content)) {
                Add-Content -Path $FilePath -Value $content -Encoding Unicode
                return $true
            }
        }
    }
    catch {}
    finally {
        Remove-Item -LiteralPath $tmpFile -Force -ErrorAction SilentlyContinue
    }

    return $false
}

function Invoke-ScanCategory {
    param(
        [string]$Name,
        [scriptblock]$Scan
    )

    try {
        & $Scan
    }
    catch {
        Add-ScanError -Category $Name -Message $_.Exception.Message
    }
}

Invoke-ScanCategory "ActiveX" {
    if ($SelectedScans -notcontains "ActiveX") { return }

    $root = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::ClassesRoot, [Microsoft.Win32.RegistryView]::Default)
    $clsidKey = $root.OpenSubKey("CLSID", $false)

    if ($clsidKey) {
        foreach ($id in $clsidKey.GetSubKeyNames()) {
            try {
                $sub = $clsidKey.OpenSubKey("$id\InProcServer32", $false)
                if ($sub) {
                    $dll = $sub.GetValue($null)
                    if ($dll -and $dll -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $dll)) {
                        $cleanDll = Get-RealExePath $dll
                        if (-not (Test-PathExists $cleanDll)) {
                            Add-Finding -Problem "ActiveX Issue" -Data $cleanDll -DisplayKey $id -RegPath "HKCR:\CLSID\$id\InProcServer32" -ValueName $null -Type "Key"
                        }
                    }
                    $sub.Close()
                }

                $sub2 = $clsidKey.OpenSubKey("$id\LocalServer32", $false)
                if ($sub2) {
                    $exe = $sub2.GetValue($null)
                    if ($exe -and $exe -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $exe)) {
                        $cleanExe = Get-RealExePath $exe
                        if (-not (Test-PathExists $cleanExe)) {
                            Add-Finding -Problem "ActiveX Issue" -Data $cleanExe -DisplayKey $id -RegPath "HKCR:\CLSID\$id\LocalServer32" -ValueName $null -Type "Key"
                        }
                    }
                    $sub2.Close()
                }
            }
            catch {}
        }

        $clsidKey.Close()
    }

    if ($root) { $root.Close() }
}

Invoke-ScanCategory "File Extensions" {
    if ($SelectedScans -notcontains "Ext") { return }

    $root = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::ClassesRoot, [Microsoft.Win32.RegistryView]::Default)

    foreach ($ext in $root.GetSubKeyNames()) {
        if ($ext.StartsWith(".")) {
            try {
                $sub = $root.OpenSubKey($ext)
                if ($sub -and $sub.SubKeyCount -eq 0 -and $null -eq $sub.GetValue($null)) {
                    Add-Finding -Problem "Unused Extension" -Data $ext -DisplayKey $ext -RegPath "HKCR:\$ext" -ValueName $null -Type "Key"
                }
                if ($sub) { $sub.Close() }
            }
            catch {}
        }
    }

    if ($root) { $root.Close() }
}

Invoke-ScanCategory "User File Associations" {
    if ($SelectedScans -notcontains "FileExts") { return }

    $path = "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts"
    $root = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($path)

    if ($root) {
        foreach ($ext in $root.GetSubKeyNames()) {
            $owl = $root.OpenSubKey("$ext\OpenWithList")
            if ($owl) {
                foreach ($valName in $owl.GetValueNames()) {
                    if ($valName -match "^[a-z]$") {
                        $val = $owl.GetValue($valName)
                        if ($val -match '^[a-zA-Z]:\\') {
                            $cleanPath = Get-RealExePath $val
                            if (-not (Test-PathExists $cleanPath)) {
                                Add-Finding -Problem "Invalid FileExt MRU" -Data $cleanPath -DisplayKey $ext -RegPath "HKCU:\$path\$ext\OpenWithList" -ValueName $valName -Type "Value"
                            }
                        }
                    }
                }
                $owl.Close()
            }
        }
        $root.Close()
    }
}

Invoke-ScanCategory "App Paths" {
    if ($SelectedScans -notcontains "AppPaths") { return }

    $key = "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"
    $root = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($key)

    if ($root) {
        foreach ($app in $root.GetSubKeyNames()) {
            try {
                $sub = $root.OpenSubKey($app)
                $path = $sub.GetValue($null)
                if ($path -and $path -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $path)) {
                    $clean = Get-RealExePath $path
                    if (-not (Test-PathExists $clean)) {
                        Add-Finding -Problem "Missing App Path" -Data $clean -DisplayKey $app -RegPath "HKLM:\$key\$app" -ValueName $null -Type "Key"
                    }
                }
                if ($sub) { $sub.Close() }
            }
            catch {}
        }
        $root.Close()
    }
}

Invoke-ScanCategory "Applications and ProgIDs" {
    if ($SelectedScans -notcontains "Apps" -and $SelectedScans -notcontains "ProgIDs") { return }

    $searchRoots = @()

    if ($SelectedScans -contains "Apps") {
        $classesRoot = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::ClassesRoot, [Microsoft.Win32.RegistryView]::Default)
        $searchRoots += $classesRoot.OpenSubKey("Applications")
    }

    if ($SelectedScans -contains "ProgIDs") {
        $searchRoots += [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::ClassesRoot, [Microsoft.Win32.RegistryView]::Default)
    }

    foreach ($root in $searchRoots) {
        if (-not $root) { continue }

        foreach ($app in $root.GetSubKeyNames()) {
            try {
                $appKey = $root.OpenSubKey($app)
                $shellKey = $appKey.OpenSubKey("shell")
                if ($shellKey) {
                    foreach ($verb in $shellKey.GetSubKeyNames()) {
                        try {
                            $cmdKey = $shellKey.OpenSubKey("$verb\command")
                            if ($cmdKey) {
                                $cmd = $cmdKey.GetValue($null)
                                if ($cmd) {
                                    $clean = Get-RealExePath $cmd
                                    if ($clean -and $clean -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $clean)) {
                                        if (-not (Test-PathExists $clean) -and $clean -notmatch "%1") {
                                            Add-Finding -Problem "Invalid App Command ($verb)" -Data $clean -DisplayKey $app -RegPath "$($root.Name)\$app\shell\$verb\command" -ValueName $null -Type "Key"
                                        }
                                    }
                                }
                                $cmdKey.Close()
                            }
                        }
                        catch {}
                    }
                    $shellKey.Close()
                }
                if ($appKey) { $appKey.Close() }
            }
            catch {}
        }

        $root.Close()
    }
}

Invoke-ScanCategory "Uninstallers" {
    if ($SelectedScans -notcontains "Uninstall") { return }

    $paths = @(
        "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        "SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    )
    $hives = @([Microsoft.Win32.Registry]::LocalMachine, [Microsoft.Win32.Registry]::CurrentUser)

    foreach ($hive in $hives) {
        foreach ($path in $paths) {
            try {
                $root = $hive.OpenSubKey($path)
                if (-not $root) { continue }

                foreach ($subName in $root.GetSubKeyNames()) {
                    $sub = $root.OpenSubKey($subName)
                    if (-not $sub) { continue }

                    $uninstallString = $sub.GetValue("UninstallString")
                    $displayName = [string]$sub.GetValue("DisplayName")
                    $isWindowsInstaller = (Test-IsRegistryFlagEnabled $sub.GetValue("WindowsInstaller")) -or (Test-IsWindowsInstallerCommand $uninstallString)
                    $isSystemComponent = Test-IsRegistryFlagEnabled $sub.GetValue("SystemComponent")
                    $isNoRemove = Test-IsRegistryFlagEnabled $sub.GetValue("NoRemove")

                    if ($uninstallString -and -not ([string]::IsNullOrWhiteSpace($displayName)) -and -not $isWindowsInstaller -and -not $isSystemComponent -and -not $isNoRemove) {
                        $clean = Get-UninstallExecutablePath $uninstallString
                        if ($clean -and -not (Test-IsWhitelisted $clean) -and -not (Test-PathExists $clean)) {
                            $rootName = if ($hive.Name -match "HKEY_LOCAL_MACHINE") { "HKLM" } else { "HKCU" }
                            $regPath = ("{0}:\{1}\{2}" -f $rootName, $path, $subName)
                            Add-Finding -Problem "Missing Uninstaller" -Data $clean -DisplayKey $displayName -RegPath $regPath -ValueName $null -Type "Key"
                        }
                    }

                    $sub.Close()
                }

                $root.Close()
            }
            catch {}
        }
    }
}

Invoke-ScanCategory "MuiCache" {
    if ($SelectedScans -notcontains "MuiCache") { return }

    $key = "Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\MuiCache"
    $root = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($key)

    if ($root) {
        foreach ($valName in $root.GetValueNames()) {
            $cleanPath = $valName -replace '\.(FriendlyAppName|ApplicationCompany)$', ''
            if ($cleanPath -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $cleanPath)) {
                if (-not (Test-PathExists $cleanPath)) {
                    Add-Finding -Problem "Obsolete MuiCache" -Data $cleanPath -DisplayKey "MuiCache" -RegPath "HKCU:\$key" -ValueName $valName -Type "Value"
                }
            }
        }
        $root.Close()
    }
}

Invoke-ScanCategory "Compatibility Store" {
    if ($SelectedScans -notcontains "AppCompat") { return }

    $key = "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Compatibility Assistant\Store"
    $root = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($key)

    if ($root) {
        foreach ($valName in $root.GetValueNames()) {
            if ($valName -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $valName)) {
                if (-not (Test-PathExists $valName)) {
                    Add-Finding -Problem "Obsolete Compatibility Ref" -Data $valName -DisplayKey "AppCompat" -RegPath "HKCU:\$key" -ValueName $valName -Type "Value"
                }
            }
        }
        $root.Close()
    }
}

Invoke-ScanCategory "Firewall Rules" {
    if ($SelectedScans -notcontains "Firewall") { return }

    $key = "SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\FirewallRules"
    $root = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($key)

    if ($root) {
        foreach ($valName in $root.GetValueNames()) {
            $data = $root.GetValue($valName)
            if ($data -match "App=([^|]+)") {
                $appPath = $matches[1]
                $expanded = [Environment]::ExpandEnvironmentVariables($appPath)
                if ($expanded -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $expanded)) {
                    if (-not (Test-PathExists $expanded)) {
                        Add-Finding -Problem "Invalid Firewall Rule" -Data $expanded -DisplayKey $valName -RegPath "HKLM:\$key" -ValueName $valName -Type "Value"
                    }
                }
            }
        }
        $root.Close()
    }
}

Invoke-ScanCategory "Services" {
    if ($SelectedScans -notcontains "Services") { return }

    $key = "SYSTEM\CurrentControlSet\Services"
    $root = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($key)

    if ($root) {
        foreach ($service in $root.GetSubKeyNames()) {
            try {
                $sub = $root.OpenSubKey($service)
                $imagePath = $sub.GetValue("ImagePath")
                if ($imagePath -and $imagePath -match '^[a-zA-Z]:\\' -and $imagePath -notmatch "\\drivers\\") {
                    $clean = Get-RealExePath $imagePath
                    if (-not (Test-PathExists $clean)) {
                        Add-Finding -Problem "Missing Service Binary" -Data $clean -DisplayKey $service -RegPath "HKLM:\$key\$service" -ValueName "ImagePath" -Type "Value"
                    }
                }
                if ($sub) { $sub.Close() }
            }
            catch {}
        }
        $root.Close()
    }
}

Invoke-ScanCategory "Type Libraries" {
    if ($SelectedScans -notcontains "TypeLib") { return }

    $root = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::ClassesRoot, [Microsoft.Win32.RegistryView]::Default)
    $typeLibKey = $root.OpenSubKey("TypeLib", $false)

    if ($typeLibKey) {
        foreach ($guid in $typeLibKey.GetSubKeyNames()) {
            try {
                $versionKey = $typeLibKey.OpenSubKey($guid)
                if ($versionKey) {
                    foreach ($version in $versionKey.GetSubKeyNames()) {
                        $numberKey = $versionKey.OpenSubKey($version)
                        if ($numberKey) {
                            $helpDir = $numberKey.GetValue("HELPDIR")
                            if ($helpDir -and $helpDir -match '^[a-zA-Z]:\\' -and -not (Test-PathExists $helpDir)) {
                                Add-Finding -Problem "Missing HelpDir" -Data $helpDir -DisplayKey $guid -RegPath "HKCR:\TypeLib\$guid\$version" -ValueName "HELPDIR" -Type "Value"
                            }
                            $numberKey.Close()
                        }
                    }
                    $versionKey.Close()
                }
            }
            catch {}
        }
        $typeLibKey.Close()
    }

    if ($root) { $root.Close() }
}

Invoke-ScanCategory "Default Icons" {
    if ($SelectedScans -notcontains "Icons") { return }

    $root = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::ClassesRoot, [Microsoft.Win32.RegistryView]::Default)

    foreach ($ext in $root.GetSubKeyNames()) {
        try {
            $iconKey = $root.OpenSubKey("$ext\DefaultIcon")
            if ($iconKey) {
                $value = $iconKey.GetValue($null)
                if ($value) {
                    $cleanPath = Get-RealExePath $value
                    if ($cleanPath -match '^[a-zA-Z]:\\' -and -not (Test-IsWhitelisted $cleanPath) -and -not (Test-PathExists $cleanPath) -and $cleanPath -notmatch "%1") {
                        Add-Finding -Problem "Invalid Default Icon" -Data $cleanPath -DisplayKey $ext -RegPath "HKCR:\$ext\DefaultIcon" -ValueName $null -Type "Key"
                    }
                }
                $iconKey.Close()
            }
        }
        catch {}
    }

    if ($root) { $root.Close() }
}

Invoke-ScanCategory "Shared DLLs" {
    if ($SelectedScans -notcontains "SharedDLLs") { return }

    $keys = @(
        "SOFTWARE\Microsoft\Windows\CurrentVersion\SharedDlls",
        "SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\SharedDlls"
    )

    foreach ($key in $keys) {
        $root = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($key)
        if ($root) {
            foreach ($valueName in $root.GetValueNames()) {
                if ($valueName -match '^[a-zA-Z]:\\' -and -not (Test-PathExists $valueName)) {
                    Add-Finding -Problem "Missing Shared Ref" -Data $valueName -DisplayKey "SharedDlls" -RegPath "HKLM:\$key" -ValueName $valueName -Type "Value"
                }
            }
            $root.Close()
        }
    }
}

Invoke-ScanCategory "Startup Items" {
    if ($SelectedScans -notcontains "Startup") { return }

    $paths = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run",
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"
    )

    foreach ($path in $paths) {
        if (Test-Path $path) {
            $properties = Get-ItemProperty $path
            foreach ($name in $properties.PSObject.Properties.Name) {
                $value = $properties.$name
                if ($value -is [string] -and $value -match '^[a-zA-Z]:\\') {
                    $cleanExe = Get-RealExePath $value
                    if (-not (Test-PathExists $cleanExe)) {
                        Add-Finding -Problem "Broken Startup" -Data $cleanExe -DisplayKey $name -RegPath $path -ValueName $name -Type "Value"
                    }
                }
            }
        }
    }
}

Invoke-ScanCategory "Installer Folders" {
    if ($SelectedScans -notcontains "Installer") { return }

    $key = "SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\Folders"
    $root = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey($key)

    if ($root) {
        foreach ($valueName in $root.GetValueNames()) {
            if ($valueName -match '^[a-zA-Z]:\\' -and -not (Test-PathExists $valueName)) {
                Add-Finding -Problem "Missing Installer Folder" -Data $valueName -DisplayKey "Installer" -RegPath "HKLM:\$key" -ValueName $valueName -Type "Value"
            }
        }
        $root.Close()
    }
}

$backupFile = ""
$removed = 0
$skipped = 0

if ($findings.Count -gt 0) {
    $dataRoot = if ($env:APPDATA) {
        Join-Path $env:APPDATA "sparkle"
    }
    else {
        Join-Path $env:TEMP "sparkle"
    }
    $backupDir = Join-Path $dataRoot "RegistryBackups"

    if (-not (Test-Path $backupDir)) {
        New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
    }

    $backupFile = Join-Path $backupDir ("DeepClean_Backup_{0}.reg" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
    Set-Content -Path $backupFile -Value @("Windows Registry Editor Version 5.00", "") -Encoding Unicode

    $backedUpPaths = @{}

    foreach ($item in $findings) {
        if (-not $backedUpPaths.ContainsKey($item.RegPath)) {
            $backupSucceeded = Backup-RegKey -ItemObj $item -FilePath $backupFile
            if (-not $backupSucceeded) {
                $skipped++
                continue
            }
            $backedUpPaths[$item.RegPath] = $true
        }

        $isKey = ($item.Type -eq "Key")
        $success = Remove-RegKeyForced -Path $item.RegPath -IsKey $isKey -ValName $item.ValueName

        if ($success) {
            $removed++
        }
        else {
            $skipped++
        }
    }
}

$sampleIssues = @(
    $findings |
        Select-Object -First 20 Problem, Data, DisplayKey, RegPath, ValueName, Type
)

[PSCustomObject]@{
    type         = "registry"
    found        = $findings.Count
    removed      = $removed
    skipped      = $skipped
    backupPath   = $backupFile
    scanErrors   = @($scanErrors)
    sampleIssues = $sampleIssues
} | ConvertTo-Json -Depth 6 -Compress
`
