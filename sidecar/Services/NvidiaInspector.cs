using System.Diagnostics;

namespace SparkleSidecar.Services;

public static class NvidiaInspector
{
    public static string GetExePath(string resourcesPath)
    {
        return Path.Combine(resourcesPath, "nvidiaProfileInspector.exe");
    }

    public static string GetNipPath(string resourcesPath)
    {
        return Path.Combine(resourcesPath, "sparklenvidia.nip");
    }

    public static async Task<(bool Success, string Output, string? Error)> RunAsync(string resourcesPath)
    {
        var exePath = GetExePath(resourcesPath);
        var nipPath = GetNipPath(resourcesPath);

        if (!File.Exists(exePath))
            return (false, "", $"nvidiaProfileInspector.exe not found at {exePath}");

        if (!File.Exists(nipPath))
            return (false, "", $"sparklenvidia.nip not found at {nipPath}");

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = exePath,
                Arguments = $"-silentImport \"{nipPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process is null)
                return (false, "", "Failed to start nvidiaProfileInspector");

            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            return (true, stdout.Length > 0 ? stdout : "Completed with no output.", null);
        }
        catch (Exception ex)
        {
            return (false, "", ex.Message);
        }
    }
}
