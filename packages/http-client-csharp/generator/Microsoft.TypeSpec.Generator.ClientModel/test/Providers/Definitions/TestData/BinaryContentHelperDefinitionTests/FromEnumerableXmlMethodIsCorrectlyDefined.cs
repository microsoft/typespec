using (global::System.IO.MemoryStream stream = new global::System.IO.MemoryStream(256))
{
    using (global::System.Xml.XmlWriter writer = global::System.Xml.XmlWriter.Create(stream, global::Sample.ModelSerializationExtensions.XmlWriterSettings))
    {
        writer.WriteStartElement(rootNameHint);
        foreach (var item in enumerable)
        {
            writer.WriteObjectValue<T>(item, global::Sample.ModelSerializationExtensions.WireOptions, childNameHint);
        }
        writer.WriteEndElement();
    }

    if ((stream.Position > int.MaxValue))
    {
        return global::System.ClientModel.BinaryContent.Create(global::System.BinaryData.FromStream(stream));
    }
    else
    {
        return global::System.ClientModel.BinaryContent.Create(new global::System.BinaryData(stream.GetBuffer().AsMemory(0, ((int)stream.Position))));
    }
}
