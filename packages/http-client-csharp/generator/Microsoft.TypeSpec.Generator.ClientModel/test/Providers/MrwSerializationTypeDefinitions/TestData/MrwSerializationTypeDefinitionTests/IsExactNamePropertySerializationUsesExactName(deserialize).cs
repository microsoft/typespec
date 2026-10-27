if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
{
    return null;
}
string accessToken = default;
global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();
foreach (var prop in element.EnumerateObject())
{
    if (prop.NameEquals("access_token"u8))
    {
        accessToken = prop.Value.GetString();
        continue;
    }
    if ((options.Format != "W"))
    {
        additionalBinaryDataProperties.Add(prop.Name, prop.Value.GetUtf8Bytes());
    }
}
return new global::Sample.Models.MockInputModel(accessToken, additionalBinaryDataProperties);
