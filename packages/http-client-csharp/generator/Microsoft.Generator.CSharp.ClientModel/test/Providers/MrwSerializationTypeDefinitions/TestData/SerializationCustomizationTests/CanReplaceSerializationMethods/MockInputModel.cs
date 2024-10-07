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
        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = (options.Format == "W") ? ((IPersistableModel<MockInputModel>)this).GetFormatFromOptions(options) : options.Format;
            if ((format != "J"))
            {
                throw new FormatException($"The model {nameof(MockInputModel)} does not support writing '{format}' format.");
            }
            if (Sample.Optional.IsDefined(Prop1))
            {
                writer.WritePropertyName("prop1"u8);
                this.SerializationMethod(writer, options);
            }
            // customization: remove Prop2 serialization
            if (((options.Format != "W") && (_additionalBinaryDataProperties != null)))
            {
                foreach (var item in _additionalBinaryDataProperties)
                {
                    writer.WritePropertyName(item.Key);
#if NET6_0_OR_GREATER
                    writer.WriteRawValue(item.Value);
#else
                    using (JsonDocument document = JsonDocument.Parse(item.Value))
                    {
                        JsonSerializer.Serialize(writer, document.RootElement);
                    }
#endif
                }
            }
        }

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
