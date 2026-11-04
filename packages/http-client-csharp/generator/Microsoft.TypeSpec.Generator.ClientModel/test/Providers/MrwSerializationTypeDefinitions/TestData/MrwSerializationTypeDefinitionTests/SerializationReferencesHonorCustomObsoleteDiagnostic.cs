#pragma warning disable OBS001 // This generated code references obsolete functionality.
internal static global::Sample.Models.Envelope DeserializeEnvelope(global::System.Text.Json.JsonElement element, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
{
    if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
    {
        return null;
    }
    global::Sample.Models.Legacy legacy = default;
    global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();
    foreach (var prop in element.EnumerateObject())
    {
        if (prop.NameEquals("legacy"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            legacy = global::Sample.Models.Legacy.DeserializeLegacy(prop.Value, options);
            continue;
        }
        if ((options.Format != "W"))
        {
            additionalBinaryDataProperties.Add(prop.Name, prop.Value.GetUtf8Bytes());
        }
    }
    return new global::Sample.Models.Envelope(legacy, additionalBinaryDataProperties);
}
#pragma warning restore OBS001 // This generated code references obsolete functionality.
