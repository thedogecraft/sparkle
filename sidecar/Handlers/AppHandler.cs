using System.Diagnostics;
using SparkleSidecar.Models;
using SparkleSidecar.Services;

namespace SparkleSidecar.Handlers;

public static class AppHandler
{
    public static async Task<object> Handle(string method, SidecarRequest request, Func<string, object?, Task>? sendEvent = null)
    {
        return method switch
        {
            "choco.check" => CheckChocolatey(),
            "choco.install" => await InstallChocolatey(),
            "app.install" => await InstallApps(request, sendEvent),
            "app.uninstall" => await UninstallApps(request, sendEvent),
            "app.checkInstalled" => await CheckInstalled(request, sendEvent),
            _ => throw new ArgumentException($"Unknown method: {method}")
        };
    }

    private static object CheckChocolatey()
    {
        var chocoPath = @"C:\ProgramData\chocolatey\bin\choco.exe";
        var installed = File.Exists(chocoPath);
        return new { success = true, installed };
    }

    private static async Task<object> InstallChocolatey()
    {
        var result = await PowerShellRunner.RunAsync("winget install --id chocolatey.chocolatey --source winget", "install-chocolatey");
        if (result.Success)
            return new { installed = true, version = result.Output.Trim() };
        return new { installed = false };
    }

    private static async Task<object> InstallApps(SidecarRequest request, Func<string, object?, Task>? sendEvent)
    {
        var props = request.GetParams<AppActionParams>();
        if (props is null)
            return new { success = false, error = "Invalid parameters" };

        foreach (var app in props.Apps)
        {
            if (sendEvent is not null)
                await sendEvent("install-progress", app);

            var command = props.Source == "Chocolatey"
                ? $"choco install {app} -y --no-progress"
                : $"winget install {app} --silent --accept-package-agreements --accept-source-agreements";

            var result = await PowerShellRunner.RunAsync(command, $"Install-{app}");

            var isChocoFailure = props.Source == "Chocolatey" &&
                !result.Success &&
                result.Output.Length > 0 &&
                !result.Output.Contains("already installed");

            if (result.Success || (result.Output.Length > 0 && result.Output.Contains("already installed")))
            {
                // success
            }
            else if (isChocoFailure)
            {
                var retryCommand = $"choco install {app} -y --no-progress --pre";
                var retryResult = await PowerShellRunner.RunAsync(retryCommand, $"Install-{app}-pre");

                if (!retryResult.Success && sendEvent is not null)
                    await sendEvent("install-error", null);
            }
            else
            {
                if (sendEvent is not null)
                    await sendEvent("install-error", null);
            }
        }

        if (sendEvent is not null)
            await sendEvent("install-complete", null);

        return new { success = true };
    }

    private static async Task<object> UninstallApps(SidecarRequest request, Func<string, object?, Task>? sendEvent)
    {
        var props = request.GetParams<AppActionParams>();
        if (props is null)
            return new { success = false, error = "Invalid parameters" };

        foreach (var app in props.Apps)
        {
            if (sendEvent is not null)
                await sendEvent("install-progress", app);

            var command = props.Source == "Chocolatey"
                ? $"choco uninstall {app} -y --no-progress"
                : $"winget uninstall {app} --silent";

            var result = await PowerShellRunner.RunAsync(command, $"Uninstall-{app}");

            if (!result.Success && sendEvent is not null)
                await sendEvent("install-error", null);
        }

        if (sendEvent is not null)
            await sendEvent("install-complete", null);

        return new { success = true };
    }

    private static async Task<object> CheckInstalled(SidecarRequest request, Func<string, object?, Task>? sendEvent)
    {
        var props = request.GetParams<AppActionParams>();
        if (props is null)
            return new { success = false, error = "Invalid parameters" };

        var result = await PowerShellRunner.RunAsync("winget list", "check-installed");
        if (!result.Success)
        {
            if (sendEvent is not null)
                await sendEvent("installed-apps-checked", new { success = false, error = result.Error });
            return new { success = false, error = result.Error };
        }

        var installedAppIds = props.Apps.Where(appId =>
        {
            var pattern = System.Text.RegularExpressions.Regex.Escape(appId);
            return System.Text.RegularExpressions.Regex.IsMatch(result.Output, $@"\b{pattern}\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }).ToArray();

        if (sendEvent is not null)
            await sendEvent("installed-apps-checked", new { success = true, installed = installedAppIds });

        return new { success = true, installed = installedAppIds };
    }
}
