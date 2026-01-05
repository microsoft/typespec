global::System.ClientModel.ClientResult result = this.GetList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<global::System.BinaryData> value = new global::System.Collections.Generic.List<global::System.BinaryData>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null))
    {
        value.Add(null);
    }
    else
    {
        using global::System.Text.Json.JsonDocument element = global::System.Text.Json.JsonDocument.ParseValue(ref jsonReader);
        value.Add(global::System.BinaryData.FromString(element.RootElement.GetRawText()));
    }
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<global::System.BinaryData>)value), result.GetRawResponse());
