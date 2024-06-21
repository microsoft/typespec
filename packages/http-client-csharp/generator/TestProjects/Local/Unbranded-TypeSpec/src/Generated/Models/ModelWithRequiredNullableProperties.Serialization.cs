// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using UnbrandedTypeSpec;

namespace UnbrandedTypeSpec.Models
{
    /// <summary></summary>
    public partial class ModelWithRequiredNullableProperties : IJsonModel<ModelWithRequiredNullableProperties>
    {
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        internal ModelWithRequiredNullableProperties(int? requiredNullablePrimitive, StringExtensibleEnum? requiredExtensibleEnum, StringFixedEnum? requiredFixedEnum, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            RequiredNullablePrimitive = requiredNullablePrimitive;
            RequiredExtensibleEnum = requiredExtensibleEnum;
            RequiredFixedEnum = requiredFixedEnum;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        internal ModelWithRequiredNullableProperties()
        {
        }

        void IJsonModel<ModelWithRequiredNullableProperties>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => WriteCore(writer, options);

        ModelWithRequiredNullableProperties IJsonModel<ModelWithRequiredNullableProperties>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => CreateCore(ref reader, options);

        BinaryData IPersistableModel<ModelWithRequiredNullableProperties>.Write(ModelReaderWriterOptions options) => WriteCore(options);

        ModelWithRequiredNullableProperties IPersistableModel<ModelWithRequiredNullableProperties>.Create(BinaryData data, ModelReaderWriterOptions options) => CreateCore(data, options);

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void WriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ModelWithRequiredNullableProperties>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ModelWithRequiredNullableProperties)} does not support writing '{format}' format.");
            }
            writer.WriteStartObject();
            if (RequiredNullablePrimitive != null)
            {
                writer.WritePropertyName("requiredNullablePrimitive"u8);
                writer.WriteNumberValue(RequiredNullablePrimitive.Value);
            }
            else
            {
                writer.WriteNull("requiredNullablePrimitive");
            }
            if (RequiredExtensibleEnum != null)
            {
                writer.WritePropertyName("requiredExtensibleEnum"u8);
                writer.WriteStringValue(RequiredExtensibleEnum.Value.ToString());
            }
            else
            {
                writer.WriteNull("requiredExtensibleEnum");
            }
            if (RequiredFixedEnum != null)
            {
                writer.WritePropertyName("requiredFixedEnum"u8);
                writer.WriteStringValue(RequiredFixedEnum.Value.ToSerialString());
            }
            else
            {
                writer.WriteNull("requiredFixedEnum");
            }
            if (options.Format != "W" && _serializedAdditionalRawData != null)
            {
                foreach (var item in _serializedAdditionalRawData)
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
            writer.WriteEndObject();
        }

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ModelWithRequiredNullableProperties CreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ModelWithRequiredNullableProperties>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ModelWithRequiredNullableProperties)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeModelWithRequiredNullableProperties(document.RootElement, options);
        }

        internal static ModelWithRequiredNullableProperties DeserializeModelWithRequiredNullableProperties(JsonElement element, ModelReaderWriterOptions options = null)
        {
            options ??= ModelSerializationExtensions.WireOptions;

            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            int? requiredNullablePrimitive = default;
            StringExtensibleEnum? requiredExtensibleEnum = default;
            StringFixedEnum? requiredFixedEnum = default;
            IDictionary<string, BinaryData> serializedAdditionalRawData = default;
            Dictionary<string, BinaryData> rawDataDictionary = new Dictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("requiredNullablePrimitive"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        requiredNullablePrimitive = null;
                        continue;
                    }
                    requiredNullablePrimitive = prop.Value.GetInt32();
                    continue;
                }
                if (prop.NameEquals("requiredExtensibleEnum"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        requiredExtensibleEnum = null;
                        continue;
                    }
                    requiredExtensibleEnum = new StringExtensibleEnum(prop.Value.GetString());
                    continue;
                }
                if (prop.NameEquals("requiredFixedEnum"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        requiredFixedEnum = null;
                        continue;
                    }
                    requiredFixedEnum = prop.Value.GetString().ToStringFixedEnum();
                    continue;
                }
                if (options.Format != "W")
                {
                    rawDataDictionary.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            serializedAdditionalRawData = rawDataDictionary;
            return new ModelWithRequiredNullableProperties(requiredNullablePrimitive, requiredExtensibleEnum, requiredFixedEnum, serializedAdditionalRawData);
        }

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData WriteCore(ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ModelWithRequiredNullableProperties>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(ModelWithRequiredNullableProperties)} does not support writing '{options.Format}' format.");
            }
        }

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ModelWithRequiredNullableProperties CreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ModelWithRequiredNullableProperties>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeModelWithRequiredNullableProperties(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(ModelWithRequiredNullableProperties)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ModelWithRequiredNullableProperties>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        internal static ModelWithRequiredNullableProperties FromResponse(PipelineResponse response)
        {
            using var document = JsonDocument.Parse(response.Content);
            return DeserializeModelWithRequiredNullableProperties(document.RootElement);
        }

        internal virtual BinaryContent ToBinaryContent()
        {
            return BinaryContent.Create(this, ModelSerializationExtensions.WireOptions);
        }
    }
}
