protected virtual void JsonModelWriteCore(global::System.Text.Json.Utf8JsonWriter writer, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
{
    string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.Container>)this).GetFormatFromOptions(options) : options.Format;
    if ((format != "J"))
    {
        throw new global::System.FormatException($"The model {nameof(global::Sample.Models.Container)} does not support writing '{format}' format.");
    }
    writer.WritePropertyName("pet"u8);
#if NET6_0_OR_GREATER
    writer.WriteRawValue(Pet);
#else
    using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(Pet))
    {
        global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
    }
#endif
    if (global::Sample.Optional.IsDefined(NullablePet))
    {
        writer.WritePropertyName("nullablePet"u8);
#if NET6_0_OR_GREATER
        writer.WriteRawValue(NullablePet);
#else
        using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(NullablePet))
        {
            global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
        }
#endif
    }
    if (global::Sample.Optional.IsCollectionDefined(Pets))
    {
        writer.WritePropertyName("pets"u8);
        writer.WriteStartArray();
        foreach (global::System.BinaryData item in Pets)
        {
            if ((item == null))
            {
                writer.WriteNullValue();
                continue;
            }
#if NET6_0_OR_GREATER
            writer.WriteRawValue(item);
#else
            using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(item))
            {
                global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
            }
#endif
        }
        writer.WriteEndArray();
    }
    if (global::Sample.Optional.IsCollectionDefined(Lookup))
    {
        writer.WritePropertyName("lookup"u8);
        writer.WriteStartObject();
        foreach (var item in Lookup)
        {
            writer.WritePropertyName(item.Key);
            if ((item.Value == null))
            {
                writer.WriteNullValue();
                continue;
            }
#if NET6_0_OR_GREATER
            writer.WriteRawValue(item.Value);
#else
            using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(item.Value))
            {
                global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
            }
#endif
        }
        writer.WriteEndObject();
    }
    if (global::Sample.Optional.IsDefined(RawPets))
    {
        writer.WritePropertyName("rawPets"u8);
#if NET6_0_OR_GREATER
        writer.WriteRawValue(RawPets);
#else
        using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(RawPets))
        {
            global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
        }
#endif
    }
    if (global::Sample.Optional.IsDefined(RawLookup))
    {
        writer.WritePropertyName("rawLookup"u8);
#if NET6_0_OR_GREATER
        writer.WriteRawValue(RawLookup);
#else
        using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(RawLookup))
        {
            global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
        }
#endif
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
}
internal static global::Sample.Models.Container DeserializeContainer(global::System.Text.Json.JsonElement element, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
{
    if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
    {
        return null;
    }
    global::System.BinaryData pet = default;
    global::System.BinaryData nullablePet = default;
    global::System.Collections.Generic.IList<global::System.BinaryData> pets = default;
    global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> lookup = default;
    global::System.BinaryData rawPets = default;
    global::System.BinaryData rawLookup = default;
    global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();
    foreach (var prop in element.EnumerateObject())
    {
        if (prop.NameEquals("pet"u8))
        {
            pet = prop.Value.GetUtf8Bytes();
            continue;
        }
        if (prop.NameEquals("nullablePet"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                nullablePet = null;
                continue;
            }
            nullablePet = prop.Value.GetUtf8Bytes();
            continue;
        }
        if (prop.NameEquals("pets"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            global::System.Collections.Generic.List<global::System.BinaryData> array = new global::System.Collections.Generic.List<global::System.BinaryData>();
            foreach (var item in prop.Value.EnumerateArray())
            {
                if ((item.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                {
                    array.Add(null);
                }
                else
                {
                    array.Add(item.GetUtf8Bytes());
                }
            }
            pets = array;
            continue;
        }
        if (prop.NameEquals("lookup"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            global::System.Collections.Generic.Dictionary<string, global::System.BinaryData> dictionary = new global::System.Collections.Generic.Dictionary<string, global::System.BinaryData>();
            foreach (var prop0 in prop.Value.EnumerateObject())
            {
                if ((prop0.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                {
                    dictionary.Add(prop0.Name, null);
                }
                else
                {
                    dictionary.Add(prop0.Name, prop0.Value.GetUtf8Bytes());
                }
            }
            lookup = dictionary;
            continue;
        }
        if (prop.NameEquals("rawPets"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            rawPets = prop.Value.GetUtf8Bytes();
            continue;
        }
        if (prop.NameEquals("rawLookup"u8))
        {
            if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                continue;
            }
            rawLookup = prop.Value.GetUtf8Bytes();
            continue;
        }
        if ((options.Format != "W"))
        {
            additionalBinaryDataProperties.Add(prop.Name, prop.Value.GetUtf8Bytes());
        }
    }
    return new global::Sample.Models.Container(
        pet,
        nullablePet,
        (pets ?? new global::Sample.ChangeTrackingList<global::System.BinaryData>()),
        (lookup ?? new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>()),
        rawPets,
        rawLookup,
        additionalBinaryDataProperties);
}
