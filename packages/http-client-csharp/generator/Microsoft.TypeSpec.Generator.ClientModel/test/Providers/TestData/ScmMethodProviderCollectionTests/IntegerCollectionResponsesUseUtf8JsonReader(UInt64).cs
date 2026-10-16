// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ulong>> GetList(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<ulong> value = new global::System.Collections.Generic.List<ulong>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add(jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ulong>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ulong>>> GetListAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetListAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.List<ulong> value = new global::System.Collections.Generic.List<ulong>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add(jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ulong>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ulong?>> GetNullableList(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetNullableList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<ulong?> value = new global::System.Collections.Generic.List<ulong?>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ulong?>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ulong?>>> GetNullableListAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetNullableListAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.List<ulong?> value = new global::System.Collections.Generic.List<ulong?>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ulong?>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ulong>> GetDictionary(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetDictionary(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, ulong> value = new global::System.Collections.Generic.Dictionary<string, ulong>();
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
    value.Add(propertyName, jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ulong>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ulong>>> GetDictionaryAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetDictionaryAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.IDictionary<string, ulong> value = new global::System.Collections.Generic.Dictionary<string, ulong>();
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
    value.Add(propertyName, jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ulong>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ulong?>> GetNullableDictionary(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetNullableDictionary(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, ulong?> value = new global::System.Collections.Generic.Dictionary<string, ulong?>();
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
    value.Add(propertyName, (jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ulong?>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ulong?>>> GetNullableDictionaryAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetNullableDictionaryAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.IDictionary<string, ulong?> value = new global::System.Collections.Generic.Dictionary<string, ulong?>();
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
    value.Add(propertyName, (jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt64());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ulong?>)value), result.GetRawResponse());
