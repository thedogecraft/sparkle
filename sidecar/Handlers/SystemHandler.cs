using System.Diagnostics;
using System.Management;
using System.Text.Json;
using SparkleSidecar.Models;
using SparkleSidecar.Services;

namespace SparkleSidecar.Handlers;

public static class SystemHandler
{
    public static async Task<object> Handle(string method, SidecarRequest request, string resourcesPath)
    {
        return method switch
        {
            "system.info" => await GetSystemInfo(),
            "system.restart" => RestartSystem(),
            "system.restartExplorer" => RestartExplorer(),
            "system.clearCache" => ClearCache(),
            "system.getUserName" => GetUserName(),
            "system.checkWinget" => CheckWinget(),
            "system.ensureWinget" => await EnsureWinget(),
            "gpu.detect" => await DetectGpuAsync(),
            _ => throw new ArgumentException($"Unknown method: {method}")
        };
    }

    private static async Task<object> GetSystemInfo()
    {
        var cpuData = await GetCpuInfoAsync();
        var osInfo = await GetOsInfoAsync();
        var memInfo = GetMemoryInfo();

        var gpuInfo = await DetectGpuAsync();
        var diskInfo = await GetDiskInfoAsync();

        return new
        {
            cpu_model = cpuData.Model,
            cpu_cores = cpuData.Cores,
            cpu_threads = cpuData.Threads,
            memory_total = memInfo.Total,
            memory_type = memInfo.Type,
            os = osInfo.Distro,
            os_version = osInfo.Version,
            gpu_model = gpuInfo.Model,
            vram = gpuInfo.Vram,
            hasGPU = gpuInfo.HasGPU,
            isNvidia = gpuInfo.IsNvidia,
            integrated_gpu = gpuInfo.IntegratedModel,
            hasIntegratedGPU = gpuInfo.HasIntegratedGPU,
            disk_model = diskInfo.Model,
            disk_size = diskInfo.Size
        };
    }

    private static object RestartSystem()
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "shutdown",
            Arguments = "/r /t 0",
            UseShellExecute = false,
            CreateNoWindow = true
        });
        return new { success = true };
    }

    private static object RestartExplorer()
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c taskkill /f /im explorer.exe & start explorer.exe",
                UseShellExecute = false,
                CreateNoWindow = true
            });
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static object ClearCache()
    {
        var errors = new List<string>();
        var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var scriptsPath = Path.Combine(appDataPath, "sparkle", "scripts");
        var logsPath = Path.Combine(appDataPath, "sparkle", "logs");

        var scriptsCleared = ClearDirectory(scriptsPath, "script", ref errors);
        var logsCleared = ClearDirectory(logsPath, "log", ref errors);

        if (errors.Count == 0)
            return new { success = true };

        return new { success = scriptsCleared || logsCleared, error = string.Join(" | ", errors) };
    }

    private static bool ClearDirectory(string path, string fileType, ref List<string> errors)
    {
        if (!Directory.Exists(path))
        {
            errors.Add($"{fileType} directory does not exist.");
            return false;
        }

        var cleared = false;
        foreach (var file in Directory.GetFiles(path))
        {
            try
            {
                File.Delete(file);
                cleared = true;
            }
            catch (Exception ex)
            {
                errors.Add($"Failed to delete {fileType} file: {Path.GetFileName(file)} - {ex.Message}");
            }
        }
        return cleared;
    }

    private static object GetUserName()
    {
        return new { username = Environment.UserName };
    }

    private static object CheckWinget()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "winget",
                Arguments = "--version",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process is null)
                return new { success = true, installed = false };

            process.WaitForExit(5000);
            return new { success = true, installed = process.ExitCode == 0 };
        }
        catch
        {
            return new { success = true, installed = false };
        }
    }

    public static async Task<object> EnsureWinget()
    {
        var checkResult = CheckWinget();
        var installed = ((JsonElement)System.Text.Json.JsonSerializer.SerializeToElement(checkResult))
            .GetProperty("installed").GetBoolean();

        if (installed)
            return new { success = true, output = "Winget is already installed. Sparkle can install apps!" };

        var result = await PowerShellRunner.RunAsync(@"
$TestMode = $false

function Check-Winget {
    try {
        $null = winget --version 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

$wingetInstalled = Check-Winget

if ($TestMode -or -not $wingetInstalled) {
    Write-Host 'Winget not found. Installing for Sparkle...'
    try {
        $job = Start-Job -ScriptBlock {
            Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe
        }
        $completed = Wait-Job -Job $job -Timeout 60
        if ($completed) {
            Receive-Job -Job $job
            Remove-Job -Job $job
        } else {
            Remove-Job -Job $job -Force
            throw 'Registration timed out after 60 seconds'
        }
        Start-Sleep -Seconds 2
        if (Check-Winget) {
            Write-Host 'Winget installed successfully!'
        } else {
            throw 'Registration completed but winget not found'
        }
    } catch {
        Write-Host ('Registration method failed: ' + $_.Exception.Message)
        Write-Host 'Trying download method...'
        try {
            $progressPreference = 'SilentlyContinue'
            $releases = Invoke-RestMethod -Uri 'https://api.github.com/repos/microsoft/winget-cli/releases/latest' -TimeoutSec 30
            $downloadUrl = ($releases.assets | Where-Object { $_.name -like '*.msixbundle' }).browser_download_url
            if (-not $downloadUrl) { throw 'Could not find download URL in GitHub release' }
            $tempFile = Join-Path $env:TEMP 'Microsoft.DesktopAppInstaller.msixbundle'
            Write-Host 'Downloading from GitHub...'
            Start-BitsTransfer -Source $downloadUrl -Destination $tempFile -TimeoutSec 120
            Write-Host 'Installing package (this may take a minute)...'
            $job = Start-Job -ScriptBlock { param($path) Add-AppxPackage -Path $path } -ArgumentList $tempFile
            $completed = Wait-Job -Job $job -Timeout 120
            if ($completed) {
                Receive-Job -Job $job
                Remove-Job -Job $job
            } else {
                Remove-Job -Job $job -Force
                throw 'Installation timed out after 120 seconds'
            }
            if (Test-Path $tempFile) { Remove-Item $tempFile -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 2
            if (Check-Winget) {
                Write-Host 'Winget installed successfully!'
            } else {
                Write-Host 'WARNING: Installation completed but winget command not available yet.'
            }
        } catch {
            Write-Host ('ERROR: Failed to install Winget. ' + $_.Exception.Message)
            Write-Host 'Manual installation: Visit https://aka.ms/getwinget'
        }
    }
} else {
    Write-Host 'Winget is already installed. Sparkle is ready to install apps!'
}", "Ensure-Winget");

        return new { success = result.Success, output = result.Output, error = result.Error };
    }

    public static async Task<GpuInfo> DetectGpuAsync()
    {
        try
        {
            var script = @"
$gpus = Get-CimInstance -ClassName Win32_VideoController | Select-Object Name, AdapterRAM, VideoProcessor
$gpus | ConvertTo-Json -Compress";
            var result = await PowerShellRunner.RunAsync(script, "Detect-GPU");

            if (!result.Success || string.IsNullOrWhiteSpace(result.Output))
                return GetDefaultGpu();

            var parsed = JsonSerializer.Deserialize<JsonElement>(result.Output);
            var items = parsed.ValueKind == JsonValueKind.Array
                ? parsed.EnumerateArray().ToArray()
                : [parsed];

            var gpu = new GpuInfo { Model = "GPU not found", Vram = "N/A" };

            foreach (var item in items)
            {
                var name = item.GetProperty("Name").GetString() ?? "";
                var adapterRam = item.TryGetProperty("AdapterRAM", out var ramEl) ? ramEl.GetInt64() : 0;
                var isNvidia = name.Contains("nvidia", StringComparison.OrdinalIgnoreCase);
                var isIntegrated = IsIntegratedGpu(name);
                var isDedicated = !isIntegrated;

                if (isIntegrated)
                {
                    gpu.IntegratedModel = name;
                    gpu.HasIntegratedGPU = true;
                }
                else if (isDedicated && adapterRam > 0)
                {
                    gpu.Model = name;
                    gpu.HasGPU = true;
                    gpu.IsNvidia = isNvidia;
                    gpu.Vram = $"{Math.Round(adapterRam / 1024.0 / 1024.0 / 1024.0, 1)} GB";
                    break;
                }
            }

            if (!gpu.HasGPU && !gpu.HasIntegratedGPU && items.Length > 0)
            {
                var first = items[0];
                gpu.Model = first.GetProperty("Name").GetString() ?? "Unknown GPU";
                gpu.HasGPU = true;
                gpu.IsNvidia = gpu.Model.Contains("nvidia", StringComparison.OrdinalIgnoreCase);
            }

            return gpu;
        }
        catch
        {
            return GetDefaultGpu();
        }
    }

    private static bool IsIntegratedGpu(string model)
    {
        var m = model.ToLower();
        return m.Contains("integrated") ||
               (m.Contains("intel") && (m.Contains("hd") || m.Contains("uhd") || m.Contains("iris"))) ||
               (m.Contains("amd") && m.Contains("radeon") && m.Contains("graphics")) ||
               (m.Contains("amd") && m.Contains("vega") && !m.Contains("rx")) ||
               m.Contains("intel graphics");
    }

    private static GpuInfo GetDefaultGpu()
    {
        return new GpuInfo
        {
            Model = "GPU not found",
            Vram = "N/A",
            HasGPU = false,
            IsNvidia = false,
            IntegratedModel = "Not detected",
            HasIntegratedGPU = false
        };
    }

    private static async Task<CpuInfo> GetCpuInfoAsync()
    {
        try
        {
            var script = @"
$cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1 Name, NumberOfCores, NumberOfLogicalProcessors
$cpu | ConvertTo-Json -Compress";
            var result = await PowerShellRunner.RunAsync(script, "Get-CPU");
            if (result.Success && !string.IsNullOrWhiteSpace(result.Output))
            {
                var parsed = JsonSerializer.Deserialize<JsonElement>(result.Output);
                return new CpuInfo
                {
                    Model = parsed.GetProperty("Name").GetString() ?? "Unknown",
                    Cores = parsed.GetProperty("NumberOfCores").GetInt32(),
                    Threads = parsed.GetProperty("NumberOfLogicalProcessors").GetInt32()
                };
            }
        }
        catch { }
        return new CpuInfo { Model = "Unknown", Cores = 0, Threads = 0 };
    }

    private static async Task<OsInfo> GetOsInfoAsync()
    {
        var distro = "Windows";
        var version = "Unknown";

        try
        {
            var script = @"(Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').DisplayVersion";
            var result = await PowerShellRunner.RunAsync(script, "GetWindowsVersion");
            if (result.Success)
                version = result.Output.Trim();
        }
        catch { }

        try
        {
            var osScript = @"(Get-CimInstance Win32_OperatingSystem).Caption";
            var osResult = await PowerShellRunner.RunAsync(osScript, "GetOSCaption");
            if (osResult.Success && !string.IsNullOrWhiteSpace(osResult.Output))
                distro = osResult.Output.Trim();
        }
        catch { }

        return new OsInfo { Distro = distro, Version = version };
    }

    private static MemoryInfo GetMemoryInfo()
    {
        return new MemoryInfo
        {
            Total = (long)GC.GetGCMemoryInfo().TotalAvailableMemoryBytes,
            Type = "Unknown"
        };
    }

    private static async Task<DiskInfo> GetDiskInfoAsync()
    {
        try
        {
            var script = @"
$disk = Get-CimInstance -ClassName Win32_DiskDrive | Where-Object { $_.Index -eq 0 } | Select-Object Model, Size -First 1
$vol = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DeviceID -eq 'C:' } | Select-Object Size -First 1
$result = @{ disk_model = ''; disk_size = '' }
if ($disk) { $result.disk_model = $disk.Name; }
if ($vol) { $result.disk_size = [math]::Round($vol.Size / 1GB, 1).ToString() + ' GB' }
$result | ConvertTo-Json -Compress";
            var result = await PowerShellRunner.RunAsync(script, "Get-Disk");
            if (result.Success && !string.IsNullOrWhiteSpace(result.Output))
            {
                var parsed = JsonSerializer.Deserialize<JsonElement>(result.Output);
                return new DiskInfo
                {
                    Model = parsed.TryGetProperty("disk_model", out var dm) ? dm.GetString() ?? "Unknown Storage" : "Unknown Storage",
                    Size = parsed.TryGetProperty("disk_size", out var ds) ? ds.GetString() ?? "Unknown" : "Unknown"
                };
            }
        }
        catch { }
        return new DiskInfo { Model = "Unknown Storage", Size = "Unknown" };
    }
}

public class GpuInfo
{
    public string Model { get; set; } = "";
    public string Vram { get; set; } = "";
    public bool HasGPU { get; set; }
    public bool IsNvidia { get; set; }
    public string IntegratedModel { get; set; } = "Not detected";
    public bool HasIntegratedGPU { get; set; }
}

public class CpuInfo
{
    public string Model { get; set; } = "";
    public int Cores { get; set; }
    public int Threads { get; set; }
}

public class OsInfo
{
    public string Distro { get; set; } = "";
    public string Version { get; set; } = "";
}

public class MemoryInfo
{
    public long Total { get; set; }
    public string Type { get; set; } = "";
}

public class DiskInfo
{
    public string Model { get; set; } = "";
    public string Size { get; set; } = "";
}
