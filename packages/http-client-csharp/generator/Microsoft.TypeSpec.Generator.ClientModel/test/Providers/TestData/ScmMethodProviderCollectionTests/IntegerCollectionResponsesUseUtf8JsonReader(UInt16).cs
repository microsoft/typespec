// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ushort>> GetList(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<ushort> value = new global::System.Collections.Generic.List<ushort>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add(jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ushort>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ushort>>> GetListAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetListAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.List<ushort> value = new global::System.Collections.Generic.List<ushort>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add(jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ushort>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ushort?>> GetNullableList(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetNullableList(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.List<ushort?> value = new global::System.Collections.Generic.List<ushort?>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ushort?>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyList<ushort?>>> GetNullableListAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetNullableListAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.List<ushort?> value = new global::System.Collections.Generic.List<ushort?>();
global::System.BinaryData data = result.GetRawResponse().Content;
global::System.Text.Json.Utf8JsonReader jsonReader = new global::System.Text.Json.Utf8JsonReader(data.ToMemory().Span);
jsonReader.Read();
while (jsonReader.Read())
{
    if ((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.EndArray))
    {
        break;
    }
    value.Add((jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyList<ushort?>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ushort>> GetDictionary(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetDictionary(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, ushort> value = new global::System.Collections.Generic.Dictionary<string, ushort>();
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
    value.Add(propertyName, jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ushort>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ushort>>> GetDictionaryAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetDictionaryAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.IDictionary<string, ushort> value = new global::System.Collections.Generic.Dictionary<string, ushort>();
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
    value.Add(propertyName, jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ushort>)value), result.GetRawResponse());
// global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ushort?>> GetNullableDictionary(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = this.GetNullableDictionary(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, ushort?> value = new global::System.Collections.Generic.Dictionary<string, ushort?>();
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
    value.Add(propertyName, (jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ushort?>)value), result.GetRawResponse());
// global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.Collections.Generic.IReadOnlyDictionary<string, ushort?>>> GetNullableDictionaryAsync(global::System.Threading.CancellationToken cancellationToken)
global::System.ClientModel.ClientResult result = await this.GetNullableDictionaryAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::System.Collections.Generic.IDictionary<string, ushort?> value = new global::System.Collections.Generic.Dictionary<string, ushort?>();
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
    value.Add(propertyName, (jsonReader.TokenType == global::System.Text.Json.JsonTokenType.Null) ? null : jsonReader.GetUInt16());
}
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IReadOnlyDictionary<string, ushort?>)value), result.GetRawResponse());
