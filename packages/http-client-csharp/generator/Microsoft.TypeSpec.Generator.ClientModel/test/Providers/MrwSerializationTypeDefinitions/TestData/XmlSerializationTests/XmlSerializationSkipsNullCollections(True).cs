string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.TestXmlModel>)this).GetFormatFromOptions(options) : options.Format;
if ((format != "X"))
{
    throw new global::System.FormatException($"The model {nameof(global::Sample.Models.TestXmlModel)} does not support writing '{format}' format.");
}

if (((Numbers != null) && global::Sample.Optional.IsCollectionDefined(Numbers)))
{
    foreach (int item in Numbers)
    {
        writer.WriteStartElement("int32");
        writer.WriteValue(item);
        writer.WriteEndElement();
    }
}
if (((Labels != null) && global::Sample.Optional.IsCollectionDefined(Labels)))
{
    foreach (var pair in Labels)
    {
        writer.WriteStartElement(pair.Key);
        writer.WriteValue(pair.Value);
        writer.WriteEndElement();
    }
}
