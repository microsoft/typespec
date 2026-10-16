// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<short>> GetList(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<short> value = new global::System.Collections.Generic.List<short>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add(jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<short>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<short>>> GetListAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetListAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.List<short> value = new global::System.Collections.Generic.List<short>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add(jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<short>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<short?>> GetNullableList(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetNullableList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<short?> value = new global::System.Collections.Generic.List<short?>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<short?>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<short?>>> GetNullableListAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetNullableListAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.List<short?> value = new global::System.Collections.Generic.List<short?>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<short?>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, short>> GetDictionary(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetDictionary(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, short> value = new global::System.Collections.Generic.Dictionary<string, short>();
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
    value.Add(propertyName, jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, short>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, short>>> GetDictionaryAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetDictionaryAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.IDictionary<string, short> value = new global::System.Collections.Generic.Dictionary<string, short>();
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
    value.Add(propertyName, jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, short>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, short?>> GetNullableDictionary(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetNullableDictionary(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, short?> value = new global::System.Collections.Generic.Dictionary<string, short?>();
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
    value.Add(propertyName, (jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, short?>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, short?>>> GetNullableDictionaryAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetNullableDictionaryAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.IDictionary<string, short?> value = new global::System.Collections.Generic.Dictionary<string, short?>();
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
    value.Add(propertyName, (jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, short?>)value), result.GetRawResponse());
