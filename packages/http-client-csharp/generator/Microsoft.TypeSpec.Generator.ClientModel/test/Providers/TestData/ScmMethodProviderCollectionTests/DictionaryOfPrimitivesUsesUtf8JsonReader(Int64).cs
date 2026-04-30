global::System.ClientModel.ClientResult result = this.GetDict(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, long> value = new global::System.Collections.Generic.Dictionary<string, long>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndObject))
    {
        break;
    }
    string propertyName = jsonReader.GetString();
    jsonReader.Read();
    value.Add(propertyName, jsonReader.GetInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, long>)value), result.GetRawResponse());
