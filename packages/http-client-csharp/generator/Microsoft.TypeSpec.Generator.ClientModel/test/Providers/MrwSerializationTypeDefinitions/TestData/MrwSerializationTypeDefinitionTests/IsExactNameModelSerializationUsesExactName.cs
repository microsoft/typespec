if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
{
    return null;
}
string name = default;
global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();
foreach (var prop in element.EnumerateObject())
{
    if (prop.NameEquals("Name"u8))
    {
        name = prop.Value.GetString();
        continue;
    }
    if ((options.Format != "W"))
    {
        additionalBinaryDataProperties.Add(prop.Name, global::System.BinaryData.FromString(prop.Value.GetRawText()));
    }
}
return new global::Sample.Models.snake_case_model(name, additionalBinaryDataProperties);
