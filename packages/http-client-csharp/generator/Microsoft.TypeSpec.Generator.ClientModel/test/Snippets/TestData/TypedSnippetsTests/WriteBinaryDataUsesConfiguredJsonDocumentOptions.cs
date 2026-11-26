#if NET6_0_OR_GREATER
writer.WriteRawValue(value);
#else
using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(value, global::Sample.ModelSerializationExtensions.JsonDocumentOptions))
{
    global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
}
#endif
