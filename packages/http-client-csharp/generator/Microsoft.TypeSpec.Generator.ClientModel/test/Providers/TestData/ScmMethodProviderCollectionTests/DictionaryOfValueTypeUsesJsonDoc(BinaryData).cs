global::System.ClientModel.ClientResult result = this.GetDict(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> value = new global::System.Collections.Generic.Dictionary<string, global::System.BinaryData>();
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
foreach (var item in document.RootElement.EnumerateObject())
{
    if ((item.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
    {
        value.Add(item.Name, null);
    }
    else
    {
        value.Add(item.Name, global::System.BinaryData.FromString(item.Value.GetRawText()));
    }
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.BinaryData>)value), result.GetRawResponse());
