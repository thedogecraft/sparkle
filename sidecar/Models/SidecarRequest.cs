using System.Text.Json;
using System.Text.Json.Serialization;

namespace SparkleSidecar.Models;

public class SidecarRequest
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("params")]
    public JsonElement? Params { get; set; }

    public T? GetParams<T>()
    {
        if (Params is null || Params.Value.ValueKind == JsonValueKind.Undefined || Params.Value.ValueKind == JsonValueKind.Null)
            return default;

        return Params.Value.Deserialize<T>();
    }
}
