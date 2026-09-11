internal static global::Sample.Models.MockInputModel DeserializeMockInputModel(global::System.Text.Json.JsonElement element, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
{
    if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
    {
        return null;
    }
    global::System.IO.File scalar = default;
    global::System.Collections.Generic.IList<global::System.IO.File> list = default;
    global::System.Collections.Generic.IDictionary<string, global::System.IO.File> dictionary = default;
    global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();
    foreach (var prop in element.EnumerateObject())
    {
        if (prop.NameEquals("scalar"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            scalar = global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::System.IO.File>(prop.Value.GetUtf8Bytes(), options, global::Sample.SampleContext.Default);
            continue;
        }
        if (prop.NameEquals("list"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            global::System.Collections.Generic.List<global::System.IO.File> array = new global::System.Collections.Generic.List<global::System.IO.File>();
            foreach (var item in prop.Value.EnumerateArray())
            {
                if ((item.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                {
                    array.Add(null);
                }
                else
                {
                    array.Add(global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::System.IO.File>(item.GetUtf8Bytes(), options, global::Sample.SampleContext.Default));
                }
            }
            list = array;
            continue;
        }
        if (prop.NameEquals("dictionary"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            global::System.Collections.Generic.Dictionary<string, global::System.IO.File> dictionary0 = new global::System.Collections.Generic.Dictionary<string, global::System.IO.File>();
            foreach (var prop0 in prop.Value.EnumerateObject())
            {
                if ((prop0.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                {
                    dictionary0.Add(prop0.Name, null);
                }
                else
                {
                    dictionary0.Add(prop0.Name, global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::System.IO.File>(prop0.Value.GetUtf8Bytes(), options, global::Sample.SampleContext.Default));
                }
            }
            dictionary = dictionary0;
            continue;
        }
        if ((options.Format != "W"))
        {
            additionalBinaryDataProperties.Add(prop.Name, global::System.BinaryData.FromString(prop.Value.GetRawText()));
        }
    }
    return new global::Sample.Models.MockInputModel(scalar, (list ?? new global::Sample.ChangeTrackingList<global::System.IO.File>()), (dictionary ?? new global::Sample.ChangeTrackingDictionary<string, global::System.IO.File>()), additionalBinaryDataProperties);
}
