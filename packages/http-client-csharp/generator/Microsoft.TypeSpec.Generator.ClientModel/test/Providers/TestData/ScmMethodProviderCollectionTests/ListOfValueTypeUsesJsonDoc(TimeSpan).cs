global::System.ClientModel.ClientResult result = this.GetList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<global::System.TimeSpan> value = new global::System.Collections.Generic.List<global::System.TimeSpan>();
global::System.BinaryData data = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data);
foreach (var item in document.RootElement.EnumerateArray())
{
    value.Add(item.GetTimeSpan("P"));
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<global::System.TimeSpan>)value), result.GetRawResponse());
