using System.Diagnostics;
using System.Net.NetworkInformation;
using System.Text;
using System.Text.Json;
using SparkleSidecar.Models;
using SparkleSidecar.Services;

namespace SparkleSidecar.Handlers;

public static class DnsHandler
{
    private static readonly Dictionary<string, (string Primary, string Secondary, string Name)> DnsConfigs = new()
    {
        ["cloudflare"] = ("1.1.1.1", "1.0.0.1", "Cloudflare"),
        ["google"] = ("8.8.8.8", "8.8.4.4", "Google"),
        ["opendns"] = ("208.67.222.222", "208.67.220.220", "OpenDNS"),
        ["quad9"] = ("9.9.9.9", "149.112.112.112", "Quad9"),
        ["adguard"] = ("94.140.14.14", "94.140.15.15", "Adguard DNS"),
        ["automatic"] = ("", "", "Automatic (DHCP)"),
    };

    public static async Task<object> Handle(string method, SidecarRequest request)
    {
        return method switch
        {
            "dns.getCurrent" => await GetCurrentDns(),
            "dns.apply" => await ApplyDns(request),
            "dns.reset" => await ResetDns(),
            "dns.test" => await TestDns(request),
            "dns.pingAll" => await PingAllDns(),
            "dns.getAdapters" => await GetAdapters(),
            "dns.flushCache" => await FlushCache(),
            _ => throw new ArgumentException($"Unknown method: {method}")
        };
    }

    private static async Task<object> GetCurrentDns()
    {
        var script = @"
Get-DnsClientServerAddress |
Where-Object { $_.ServerAddresses.Count -gt 0 } |
ForEach-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue
    if ($adapter) {
        $dnsList = $_.ServerAddresses | Where-Object { $_ -notmatch '^fec0' }
        if ($dnsList) {
            Write-Host ('{0} | {1}' -f $adapter.Name, ($dnsList -join ', '))
        }
    }
}";

        var result = await PowerShellRunner.RunAsync(script, "Get-DNS");
        if (!result.Success)
            return new { success = false, error = result.Error };

        var lines = result.Output.Trim().Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Where(l => l.Contains('|')).ToArray();

        var dnsInfo = lines.Select(line =>
        {
            var parts = line.Split('|', 2);
            return new { adapter = parts[0].Trim(), servers = parts[1].Trim() };
        }).ToArray();

        return new { success = true, data = dnsInfo };
    }

    private static async Task<object> ApplyDns(SidecarRequest request)
    {
        var props = request.GetParams<DnsApplyParams>();
        if (props is null)
            return new { success = false, error = "Invalid parameters" };

        var normalizedType = props.DnsType.ToLower();
        if (normalizedType != "custom" && !DnsConfigs.ContainsKey(normalizedType))
            return new { success = false, error = "Invalid DNS type. Available options: cloudflare, google, opendns, quad9, adguard, automatic, custom" };

        (string Primary, string Secondary, string Name) config;
        if (normalizedType == "custom")
        {
            if (string.IsNullOrEmpty(props.PrimaryDNS))
                return new { success = false, error = "Primary DNS is required for custom DNS" };
            config = (props.PrimaryDNS, props.SecondaryDNS ?? "", "Custom");
        }
        else
        {
            config = DnsConfigs[normalizedType];
        }

        var adapters = await GetActiveAdapters();
        if (adapters.Count == 0)
            return new { success = false, error = "No active network adapters found" };

        var results = new List<string>();
        foreach (var adapter in adapters)
        {
            string[]? dnsServers = null;
            if (normalizedType != "automatic" && !string.IsNullOrEmpty(config.Primary))
            {
                dnsServers = string.IsNullOrEmpty(config.Secondary)
                    ? [config.Primary]
                    : [config.Primary, config.Secondary];
            }

            var success = await SetDnsServers(adapter.IfIndex, dnsServers);
            if (success)
            {
                results.Add(dnsServers is null
                    ? $"Set {adapter.Name} to automatic DNS (DHCP)"
                    : $"Set {adapter.Name} to {config.Name} DNS: {string.Join(", ", dnsServers)}");
            }
            else
            {
                results.Add($"Error configuring DNS for {adapter.Name}");
            }
        }

        await FlushDnsCache();

        return new { success = true, output = string.Join("\n", results) + "\nDNS configuration completed successfully!" };
    }

    private static async Task<object> ResetDns()
    {
        var adapters = await GetActiveAdapters();
        if (adapters.Count == 0)
            return new { success = false, error = "No active network adapters found" };

        var results = new List<string>();
        foreach (var adapter in adapters)
        {
            var success = await SetDnsServers(adapter.IfIndex, null);
            results.Add(success
                ? $"Reset {adapter.Name} to automatic DNS (DHCP)"
                : $"Error resetting DNS for {adapter.Name}");
        }

        await FlushDnsCache();

        return new { success = true, output = string.Join("\n", results) + "\nDNS settings reverted to automatic successfully!" };
    }

    private static async Task<object> TestDns(SidecarRequest request)
    {
        var props = request.GetParams<DnsTestParams>();
        var hostname = props?.Hostname ?? "google.com";

        var script = $@"
try {{
    $result = nslookup {hostname} 2>&1
    Write-Host 'DNS Test Results for {hostname}:'
    Write-Host $result
}} catch {{
    Write-Host ('Error testing DNS: ' + $_.Exception.Message)
}}";

        var result = await PowerShellRunner.RunAsync(script, "Test-DNS");
        return new { success = result.Success, output = result.Output, error = result.Error };
    }

    private static async Task<object> PingAllDns()
    {
        var dnsServers = new[]
        {
            ("Cloudflare", "1.1.1.1"),
            ("Google", "8.8.8.8"),
            ("OpenDNS", "208.67.222.222"),
            ("Quad9", "9.9.9.9"),
            ("AdGuard DNS", "94.140.14.14"),
        };

        var results = new List<object>();

        foreach (var (name, server) in dnsServers)
        {
            var (latency, status) = await PingServer(server);
            results.Add(new { name, server, latency, status });
        }

        return new { success = true, data = results };
    }

    private static async Task<object> GetAdapters()
    {
        var script = @"
Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
    Write-Host ('{0}|{1}|{2}' -f $_.Name, $_.InterfaceDescription, $_.Status)
}";

        var result = await PowerShellRunner.RunAsync(script, "Get-Adapters");
        if (!result.Success)
            return new { success = false, error = result.Error };

        var lines = result.Output.Trim().Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Where(l => l.Contains('|')).ToArray();

        var adapters = lines.Select(line =>
        {
            var parts = line.Split('|', 3);
            return new { name = parts[0].Trim(), description = parts[1].Trim(), status = parts[2].Trim() };
        }).ToArray();

        return new { success = true, data = adapters };
    }

    private static async Task<object> FlushCache()
    {
        await FlushDnsCache();
        return new { success = true, output = "DNS cache flushed successfully!" };
    }

    private static async Task<List<NetworkAdapter>> GetActiveAdapters()
    {
        var script = @"Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ConvertTo-Json -Compress";
        var result = await PowerShellRunner.RunAsync(script, "Get-Adapters-Internal");

        if (!result.Success || string.IsNullOrWhiteSpace(result.Output))
            return [];

        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(result.Output);
            var items = parsed.ValueKind == JsonValueKind.Array
                ? parsed.EnumerateArray().ToArray()
                : [parsed];

            return items.Select(a => new NetworkAdapter
            {
                Name = a.GetProperty("Name").GetString() ?? "",
                IfIndex = a.GetProperty("ifIndex").GetInt32()
            }).ToList();
        }
        catch
        {
            return [];
        }
    }

    private static async Task<bool> SetDnsServers(int ifIndex, string[]? dnsServers)
    {
        string cmd;
        if (dnsServers is null)
        {
            cmd = $"Set-DnsClientServerAddress -InterfaceIndex {ifIndex} -ResetServerAddresses";
        }
        else
        {
            var servers = string.Join(",", dnsServers.Select(s => $"'{s}'"));
            cmd = $"Set-DnsClientServerAddress -InterfaceIndex {ifIndex} -ServerAddresses @({servers})";
        }

        var result = await PowerShellRunner.RunCommandAsync(cmd);
        return result.Success;
    }

    private static async Task FlushDnsCache()
    {
        await PowerShellRunner.RunCommandAsync("ipconfig /flushdns");
    }

    private static async Task<(int? Latency, string Status)> PingServer(string server)
    {
        try
        {
            using var ping = new Ping();
            var reply = await ping.SendPingAsync(server, 1000);

            if (reply.Status == IPStatus.Success)
                return ((int?)reply.RoundtripTime, "success");

            return (null, "timeout");
        }
        catch
        {
            return (null, "error");
        }
    }
}

public class NetworkAdapter
{
    public string Name { get; set; } = "";
    public int IfIndex { get; set; }
}
