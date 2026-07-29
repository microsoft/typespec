global::System.ClientModel.ClientResult result = this.GetList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<global::System.BinaryData> value = new global::System.Collections.Generic.List<global::System.BinaryData>();
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
foreach (var item in document.RootElement.EnumerateArray())
{
    if ((item.ValueKind == global::System.Text.Json.JsonValueKind.Null))
    {
        value.Add(null);
    }
    else
    {
        value.Add(global::System.BinaryData.FromString(item.GetRawText()));
    }
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<global::System.BinaryData>)value), result.GetRawResponse());
