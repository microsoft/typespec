public virtual global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, int>> GetSpecialCase(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetSpecialCase(cancellationToken.ToRequestOptions());
    global::System.Collections.Generic.IDictionary<string, int> value = new global::System.Collections.Generic.Dictionary<string, int>();
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
        value.Add(propertyName, jsonReader.GetInt32());
    }
    return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, int>)value), result.GetRawResponse());
}
