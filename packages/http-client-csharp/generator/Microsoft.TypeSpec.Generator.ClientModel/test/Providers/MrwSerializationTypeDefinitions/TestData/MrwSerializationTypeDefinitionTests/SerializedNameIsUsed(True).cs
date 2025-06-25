string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>)this).GetFormatFromOptions(options) : options.Format;
if ((format != "J"))
{
    throw new global::System.FormatException($"The model {nameof(global::Sample.Models.MockInputModel)} does not support writing '{format}' format.");
}
if (global::Sample.Optional.IsDefined(MockProperty))
{
    writer.WritePropertyName("mock_wire_name"u8);
    writer.WriteNumberValue(MockProperty.Value);
}
else
{
    writer.WriteNull("mock_wire_name"u8);
}
if (((options.Format != "W") && (_additionalBinaryDataProperties != null)))
{
    foreach (var item in _additionalBinaryDataProperties)
    {
        writer.WritePropertyName(item.Key);
#if NET6_0_OR_GREATER
        writer.WriteRawValue(item.Value);
#else
        using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(item.Value))
        {
            global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
        }
#endif
    }
}
