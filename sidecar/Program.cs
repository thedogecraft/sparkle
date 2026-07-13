using System.Text;
using System.Text.Json;
using SparkleSidecar.Handlers;
using SparkleSidecar.Models;

namespace SparkleSidecar;

public class Program
{
    private static string _resourcesPath = "";
    private static readonly SemaphoreSlim _writeLock = new(1, 1);

    public static async Task Main(string[] args)
    {
        Console.InputEncoding = Encoding.UTF8;
        Console.OutputEncoding = Encoding.UTF8;

        _resourcesPath = GetArg(args, "--resources-path") ?? GetDefaultResourcesPath();

        var readyResponse = SidecarResponse.Push("sidecar.ready", new { version = "1.0.0" });
        await WriteResponse(readyResponse);

        var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
        };

        try
        {
            await ProcessInputLoop(cts.Token);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            var errResponse = SidecarResponse.Push("sidecar.fatal", new { error = ex.Message });
            await WriteResponse(errResponse);
        }
    }

    private static async Task ProcessInputLoop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            string? line;
            try
            {
                line = await Console.In.ReadLineAsync(ct);
            }
            catch (OperationCanceledException) { break; }

            if (line is null)
                break;

            if (string.IsNullOrWhiteSpace(line))
                continue;

            _ = ProcessRequest(line);
        }
    }

    private static async Task ProcessRequest(string line)
    {
        SidecarRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<SidecarRequest>(line);
        }
        catch (Exception ex)
        {
            var errResponse = SidecarResponse.Fail("", $"Invalid JSON: {ex.Message}");
            await WriteResponse(errResponse);
            return;
        }

        if (request is null)
        {
            var errResponse = SidecarResponse.Fail("", "Empty request");
            await WriteResponse(errResponse);
            return;
        }

        try
        {
            var result = await DispatchRequest(request);
            var response = SidecarResponse.Ok(request.Id, result);
            await WriteResponse(response);
        }
        catch (Exception ex)
        {
            var errResponse = SidecarResponse.Fail(request.Id, ex.Message);
            await WriteResponse(errResponse);
        }
    }

    private static async Task<object> DispatchRequest(SidecarRequest request)
    {
        var method = request.Method;

        if (method.StartsWith("tweak.") || method.StartsWith("tweaks.") || method == "nvidia.inspector")
            return await TweakHandler.Handle(method, request, _resourcesPath);

        if (method.StartsWith("dns."))
            return await DnsHandler.Handle(method, request);

        if (method.StartsWith("system.") || method == "gpu.detect")
            return await SystemHandler.Handle(method, request, _resourcesPath);

        if (method.StartsWith("backup."))
            return await BackupHandler.Handle(method, request);

        if (method.StartsWith("app.") || method.StartsWith("choco."))
            return await AppHandler.Handle(method, request, SendEventAsync);

        if (method == "powershell.run")
        {
            var props = request.GetParams<PowerShellParams>();
            var result = await Services.PowerShellRunner.RunAsync(props?.Script ?? "", props?.Name ?? "script");
            return new { success = result.Success, output = result.Output, error = result.Error };
        }

        if (method == "powershell.runWindow")
        {
            var props = request.GetParams<PowerShellWindowParams>();
            Services.PowerShellRunner.RunInWindow(props?.Script ?? "", props?.Name ?? "script", props?.NoExit ?? true);
            return new { success = true };
        }

        throw new ArgumentException($"Unknown method: {method}");
    }

    private static async Task SendEventAsync(string eventName, object? data)
    {
        var response = SidecarResponse.Push(eventName, data);
        await WriteResponse(response);
    }

    private static async Task WriteResponse(SidecarResponse response)
    {
        var json = response.ToJson();
        await _writeLock.WaitAsync();
        try
        {
            await Console.Out.WriteLineAsync(json);
            await Console.Out.FlushAsync();
        }
        finally
        {
            _writeLock.Release();
        }
    }

    private static string? GetArg(string[] args, string name)
    {
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == name)
                return args[i + 1];
        }
        return null;
    }

    private static string GetDefaultResourcesPath()
    {
        var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        return Path.Combine(appDataPath, "sparkle", "resources");
    }
}
