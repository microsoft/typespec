#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using Sample;

namespace Sample.Models
{
    /// <summary></summary>
    public partial class MockInputModel : IJsonModel<MockInputModel>
    {
        internal static MockInputModel DeserializeMockInputModel(JsonElement element, ModelReaderWriterOptions options)
        {
            if ((element.ValueKind == JsonValueKind.Null))
            {
                return null;
            }
            string prop1 = default;
            string prop2 = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = new ChangeTrackingDictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("prop1"u8))
                {
                    if ((prop.Value.ValueKind == JsonValueKind.Null))
                    {
                        prop1 = null;
                        continue;
                    }
                    prop1 = prop.Value.GetString();
                    continue;
                }
                // customization: remove Prop2 deserialization
                if ((options.Format != "W"))
                {
                    additionalBinaryDataProperties.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            return new MockInputModel(prop1, prop2, additionalBinaryDataProperties);
        }
    }
}
