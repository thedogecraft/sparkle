using System.Text.Json.Serialization;

namespace SparkleSidecar.Models;

public class TweakApplyParams
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("script")]
    public string Script { get; set; } = "";
}

public class TweakUnapplyParams
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("script")]
    public string Script { get; set; } = "";
}

public class TweakStatesSaveParams
{
    [JsonPropertyName("data")]
    public string Data { get; set; } = "";
}

public class PowerShellParams
{
    [JsonPropertyName("script")]
    public string Script { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "script";
}

public class PowerShellWindowParams
{
    [JsonPropertyName("script")]
    public string Script { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "script";

    [JsonPropertyName("noExit")]
    public bool NoExit { get; set; } = true;
}

public class DnsApplyParams
{
    [JsonPropertyName("dnsType")]
    public string DnsType { get; set; } = "";

    [JsonPropertyName("primaryDNS")]
    public string? PrimaryDNS { get; set; }

    [JsonPropertyName("secondaryDNS")]
    public string? SecondaryDNS { get; set; }
}

public class DnsTestParams
{
    [JsonPropertyName("hostname")]
    public string Hostname { get; set; } = "google.com";
}

public class AppActionParams
{
    [JsonPropertyName("action")]
    public string Action { get; set; } = "";

    [JsonPropertyName("apps")]
    public List<string> Apps { get; set; } = [];

    [JsonPropertyName("source")]
    public string Source { get; set; } = "";
}

public class RestorePointParams
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class RestoreSequenceParams
{
    [JsonPropertyName("sequenceNumber")]
    public int SequenceNumber { get; set; }
}

public class InstallChocoParams
{
    [JsonPropertyName("script")]
    public string? Script { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}
