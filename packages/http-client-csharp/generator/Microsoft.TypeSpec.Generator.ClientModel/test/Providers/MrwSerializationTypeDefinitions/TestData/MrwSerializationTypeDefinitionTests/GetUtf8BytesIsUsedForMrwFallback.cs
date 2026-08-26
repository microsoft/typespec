if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
{
    return null;
}
global::System.IO.File mockProperty = default;
global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();
foreach (var prop in element.EnumerateObject())
{
    if (prop.NameEquals("mockProperty"u8))
    {
        if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
        {
            continue;
        }
        mockProperty = global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::System.IO.File>(prop.Value.GetUtf8Bytes(), global::Sample.ModelSerializationExtensions.WireOptions, global::Sample.SampleContext.Default);
        continue;
    }
    if ((options.Format != "W"))
    {
        additionalBinaryDataProperties.Add(prop.Name, global::System.BinaryData.FromString(prop.Value.GetRawText()));
    }
}
return new global::Sample.Models.MockInputModel(mockProperty, additionalBinaryDataProperties);
