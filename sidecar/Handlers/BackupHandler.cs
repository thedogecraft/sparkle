using System.Text.Json;
using SparkleSidecar.Models;
using SparkleSidecar.Services;

namespace SparkleSidecar.Handlers;

public static class BackupHandler
{
    public static async Task<object> Handle(string method, SidecarRequest request)
    {
        return method switch
        {
            "backup.create" => await CreateRestorePoint(request),
            "backup.createSparkle" => await CreateSparkleRestorePoint(),
            "backup.list" => await ListRestorePoints(),
            "backup.restore" => await RestoreToPoint(request),
            "backup.deleteAll" => await DeleteAllRestorePoints(),
            "backup.deleteOld" => DeleteOldBackups(),
            _ => throw new ArgumentException($"Unknown method: {method}")
        };
    }

    private static async Task<object> CreateRestorePoint(SidecarRequest request)
    {
        var props = request.GetParams<RestorePointParams>();
        var label = props?.Name is not null
            ? $"{props.Name}-{GetTimestamp()}"
            : $"ManualRestore-{GetTimestamp()}";

        try
        {
            await PowerShellRunner.RunCommandAsync($"Checkpoint-Computer -Description '{label}'");
            await ChangeRestorePointCooldown();
            return new { success = true, label };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static async Task<object> CreateSparkleRestorePoint()
    {
        var label = $"SparkleBackup-{GetTimestamp()}";
        try
        {
            await PowerShellRunner.RunCommandAsync($"Checkpoint-Computer -Description '{label}'");
            await ChangeRestorePointCooldown();
            return new { success = true, label };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static async Task<object> ListRestorePoints()
    {
        try
        {
            var result = await PowerShellRunner.RunCommandAsync(
                "Get-ComputerRestorePoint | Select-Object SequenceNumber, Description, CreationTime, EventType, RestorePointType | ConvertTo-Json");

            await ChangeRestorePointCooldown();

            if (!result.Success)
                return new { success = false, error = "Failed to list restore points" };

            var points = new object();
            try
            {
                points = JsonSerializer.Deserialize<object>(result.Output) ?? new object();
            }
            catch
            {
                points = Array.Empty<object>();
            }

            return new { success = true, points };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static async Task<object> RestoreToPoint(SidecarRequest request)
    {
        var props = request.GetParams<RestoreSequenceParams>();
        if (props is null)
            return new { success = false, error = "Invalid parameters" };

        try
        {
            await PowerShellRunner.RunCommandAsync($"Restore-Computer -RestorePoint {props.SequenceNumber}");
            await ChangeRestorePointCooldown();
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static async Task<object> DeleteAllRestorePoints()
    {
        try
        {
            await PowerShellRunner.RunCommandAsync("vssadmin delete shadows /all /quiet");
            await ChangeRestorePointCooldown();
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static object DeleteOldBackups()
    {
        var sparkleRoot = @"C:\Sparkle";
        if (!Directory.Exists(sparkleRoot))
            return new { success = true, message = "Sparkle folder does not exist" };

        try
        {
            Directory.Delete(sparkleRoot, true);
            return new { success = true, message = "Sparkle folder deleted" };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private static async Task ChangeRestorePointCooldown()
    {
        await PowerShellRunner.RunCommandAsync(
            "New-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore' -Name 'SystemRestorePointCreationFrequency' -Value 0 -PropertyType DWord -Force");
    }

    private static string GetTimestamp()
    {
        return DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
    }
}
