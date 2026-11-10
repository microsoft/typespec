internal override void XmlModelWriteCore(global::System.Xml.XmlWriter writer, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
{
    string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.Derived>)this).GetFormatFromOptions(options) : options.Format;
    if ((format != "X"))
    {
        throw new global::System.FormatException($"The model {nameof(global::Sample.Models.Derived)} does not support writing '{format}' format.");
    }

    base.XmlModelWriteCore(writer, options);
#pragma warning disable CS0612 // This generated code references obsolete functionality.
#pragma warning disable CS0618 // This generated code references obsolete functionality.
    if (global::Sample.Optional.IsDefined(Attribute))
    {
        writer.WriteStartAttribute("attribute");
        writer.WriteValue(Attribute);
        writer.WriteEndAttribute();
    }
#pragma warning restore CS0618 // This generated code references obsolete functionality.
#pragma warning restore CS0612 // This generated code references obsolete functionality.
#pragma warning disable CS0612 // This generated code references obsolete functionality.
#pragma warning disable CS0618 // This generated code references obsolete functionality.
    if (global::Sample.Optional.IsDefined(Element))
    {
        writer.WriteStartElement("element");
        writer.WriteValue(Element);
        writer.WriteEndElement();
    }
#pragma warning restore CS0618 // This generated code references obsolete functionality.
#pragma warning restore CS0612 // This generated code references obsolete functionality.
}
