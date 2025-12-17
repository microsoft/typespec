global::System.ClientModel.ClientResult result = this.GetDict(cancellationToken.ToRequestOptions());
global::System.Collections.Generic.IDictionary<string, global::System.Uri> value = new global::System.Collections.Generic.Dictionary<string, global::System.Uri>();
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
    using global::System.Text.Json.JsonDocument element = global::System.Text.Json.JsonDocument.ParseValue(ref jsonReader);
    value.Add(propertyName, global::System.Uri.DeserializeUri(element.RootElement, global::Sample.ModelSerializationExtensions.WireOptions));
}
global::System.BinaryData data0 = result.GetRawResponse().Content;
using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data0);
global::System.Text.Json.JsonElement element0 = document.RootElement;
return global::System.ClientModel.ClientResult.FromValue(global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::System.Collections.Generic.IDictionary<string, global::System.Uri>>(data0, global::Sample.ModelSerializationExtensions.WireOptions, global::Sample.SampleContext.Default), result.GetRawResponse());
