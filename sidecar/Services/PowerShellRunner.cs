using System.Diagnostics;
using System.Text;

namespace SparkleSidecar.Services;

public static class PowerShellRunner
{
    public static async Task<(bool Success, string Output, string? Error)> RunAsync(string script, string name = "script")
    {
        var tempDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "sparkle", "scripts");
        Directory.CreateDirectory(tempDir);

        var tempFile = Path.Combine(tempDir, $"{name}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}.ps1");

        try
        {
            await File.WriteAllTextAsync(tempFile, script, Encoding.UTF8);

            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -ExecutionPolicy Bypass -File \"{tempFile}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            using var process = Process.Start(psi);
            if (process is null)
                return (false, "", "Failed to start PowerShell process");

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            return (true, stdout, stderr.Length > 0 ? stderr : null);
        }
        catch (Exception ex)
        {
            return (false, "", ex.Message);
        }
        finally
        {
            try { File.Delete(tempFile); } catch { }
        }
    }

    public static void RunInWindow(string script, string name = "script", bool noExit = true)
    {
        var tempDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "sparkle", "scripts");
        Directory.CreateDirectory(tempDir);

        var tempFile = Path.Combine(tempDir, $"{name}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}.ps1");
        File.WriteAllText(tempFile, script, Encoding.UTF8);

        var noExitFlag = noExit ? "-NoExit" : "";
        var psi = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = $"/c start powershell.exe {noExitFlag} -ExecutionPolicy Bypass -File \"{tempFile}\"",
            UseShellExecute = false,
            CreateNoWindow = true
        };

        Process.Start(psi);
    }

    public static async Task<(bool Success, string Output)> RunCommandAsync(string command)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{command}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
            WindowStyle = ProcessWindowStyle.Hidden
        };

        try
        {
            using var process = Process.Start(psi);
            if (process is null)
                return (false, "");

            var stdout = await process.StandardOutput.ReadToEndAsync();
            await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            return (true, stdout);
        }
        catch
        {
            return (false, "");
        }
    }
}
