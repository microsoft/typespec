global::System.ClientModel.ClientResult result = this.GetDict(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, string> value = new global::System.Collections.Generic.Dictionary<string, string>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndObject))
    {
        break;
    }
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.StartObject))
    {
        continue;
    }
    string propertyName = jsonReader.GetString();
    jsonReader.Read();
    value.Add(propertyName, jsonReader.GetString());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, string>)value), result.GetRawResponse());
