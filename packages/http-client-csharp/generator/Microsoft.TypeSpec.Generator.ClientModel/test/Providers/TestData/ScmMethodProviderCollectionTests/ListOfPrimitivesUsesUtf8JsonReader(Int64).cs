global::System.ClientModel.ClientResult result = this.GetList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<long> value = new global::System.Collections.Generic.List<long>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add(jsonReader.GetInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<long>)value), result.GetRawResponse());
