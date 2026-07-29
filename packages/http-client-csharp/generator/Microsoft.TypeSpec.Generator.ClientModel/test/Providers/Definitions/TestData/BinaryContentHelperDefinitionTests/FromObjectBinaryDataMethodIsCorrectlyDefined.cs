global::Sample.Utf8JsonBinaryContent content = new global::Sample.Utf8JsonBinaryContent();
#if NET6_0_OR_GREATER
content.JsonWriter.WriteRawValue(value);
#else
using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(value))
{
    global::System.Text.Json.JsonSerializer.Serialize(content.JsonWriter, document.RootElement);
}
#endif
return content;
