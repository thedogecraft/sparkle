using System.Text.Json;
using System.Text.Json.Serialization;

namespace SparkleSidecar.Models;

public class SidecarResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("result")]
    public object? Result { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("event")]
    public string? Event { get; set; }

    public static SidecarResponse Ok(string id, object? result = null)
    {
        return new SidecarResponse { Id = id, Result = result };
    }

    public static SidecarResponse Fail(string id, string error)
    {
        return new SidecarResponse { Id = id, Error = error };
    }

    public static SidecarResponse Push(string eventName, object? data = null)
    {
        return new SidecarResponse { Id = "", Event = eventName, Result = data };
    }

    public string ToJson()
    {
        return JsonSerializer.Serialize(this, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });
    }
}
