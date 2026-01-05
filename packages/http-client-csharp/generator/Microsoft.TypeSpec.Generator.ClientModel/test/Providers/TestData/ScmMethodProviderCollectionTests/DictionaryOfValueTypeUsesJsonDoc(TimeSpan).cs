global::System.ClientModel.ClientResult result = this.GetDict(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, global::System.TimeSpan> value = new global::System.Collections.Generic.Dictionary<string, global::System.TimeSpan>();
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
foreach (var item in document.RootElement.EnumerateObject())
{
    value.Add(item.Name, item.Value.GetTimeSpan("P"));
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, global::System.TimeSpan>)value), result.GetRawResponse());
