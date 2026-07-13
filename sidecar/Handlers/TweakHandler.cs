using System.Text.Json;
using SparkleSidecar.Models;
using SparkleSidecar.Services;

namespace SparkleSidecar.Handlers;

public static class TweakHandler
{
    public static async Task<object> Handle(string method, SidecarRequest request, string resourcesPath)
    {
        return method switch
        {
            "tweak.apply" => await ApplyTweak(request, resourcesPath),
            "tweak.unapply" => await UnapplyTweak(request),
            "tweak.states.load" => LoadStates(),
            "tweak.states.save" => SaveStates(request),
            "tweak.active" => GetActiveTweaks(),
            "nvidia.inspector" => await RunNvidiaInspector(resourcesPath),
            _ => throw new ArgumentException($"Unknown method: {method}")
        };
    }

    private static async Task<object> ApplyTweak(SidecarRequest request, string resourcesPath)
    {
        var props = request.GetParams<TweakApplyParams>();
        if (props is null || string.IsNullOrEmpty(props.Name))
            throw new ArgumentException("Tweak name is required");

        if (string.IsNullOrEmpty(props.Script))
            throw new ArgumentException($"No apply script provided for tweak: {props.Name}");

        if (props.Name == "optimize-nvidia-settings")
        {
            var result = await NvidiaInspector.RunAsync(resourcesPath);
            return new { success = result.Success, output = result.Output, error = result.Error };
        }

        var psResult = await PowerShellRunner.RunAsync(props.Script, props.Name);
        return new { success = psResult.Success, output = psResult.Output, error = psResult.Error };
    }

    private static async Task<object> UnapplyTweak(SidecarRequest request)
    {
        var props = request.GetParams<TweakUnapplyParams>();
        if (props is null || string.IsNullOrEmpty(props.Name))
            throw new ArgumentException("Tweak name is required");

        if (string.IsNullOrEmpty(props.Script))
            throw new ArgumentException($"No unapply script provided for tweak: {props.Name}");

        var result = await PowerShellRunner.RunAsync(props.Script, props.Name);
        return new { success = result.Success, output = result.Output, error = result.Error };
    }

    private static object LoadStates()
    {
        var statePath = GetStatePath();
        if (!File.Exists(statePath))
            return new Dictionary<string, object>();

        var json = File.ReadAllText(statePath);
        return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json) ?? [];
    }

    private static object SaveStates(SidecarRequest request)
    {
        var data = request.GetParams<TweakStatesSaveParams>()?.Data ?? "{}";
        var statePath = GetStatePath();
        Directory.CreateDirectory(Path.GetDirectoryName(statePath)!);
        File.WriteAllText(statePath, data);
        return new { success = true };
    }

    private static object GetActiveTweaks()
    {
        var statePath = GetStatePath();
        if (!File.Exists(statePath))
            return new { active = Array.Empty<string>() };

        try
        {
            var json = File.ReadAllText(statePath);
            var parsed = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json) ?? [];
            var active = parsed.Where(kvp =>
                kvp.Value.ValueKind == JsonValueKind.True ||
                (kvp.Value.ValueKind == JsonValueKind.String && kvp.Value.GetString() == "true")
            ).Select(kvp => kvp.Key).ToArray();
            return new { active };
        }
        catch
        {
            return new { active = Array.Empty<string>() };
        }
    }

    private static async Task<object> RunNvidiaInspector(string resourcesPath)
    {
        var result = await NvidiaInspector.RunAsync(resourcesPath);
        return new { success = result.Success, output = result.Output, error = result.Error };
    }

    private static string GetStatePath()
    {
        var userDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        return Path.Combine(userDataPath, "sparkle", "tweakStates.json");
    }
}
