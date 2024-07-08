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
    public abstract partial class BaseModelWithDiscriminator : IJsonModel<BaseModelWithDiscriminator>
    {
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        internal BaseModelWithDiscriminator(string discriminatorProperty, string optionalPropertyOnBase, int requiredPropertyOnBase, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            DiscriminatorProperty = discriminatorProperty;
            OptionalPropertyOnBase = optionalPropertyOnBase;
            RequiredPropertyOnBase = requiredPropertyOnBase;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        internal BaseModelWithDiscriminator()
        {
        }

        void IJsonModel<BaseModelWithDiscriminator>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminator>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(BaseModelWithDiscriminator)} does not support writing '{format}' format.");
            }
            writer.WritePropertyName("discriminatorProperty"u8);
            writer.WriteStringValue(DiscriminatorProperty);
            if (Optional.IsDefined(OptionalPropertyOnBase))
            {
                writer.WritePropertyName("optionalPropertyOnBase"u8);
                writer.WriteStringValue(OptionalPropertyOnBase);
            }
            writer.WritePropertyName("requiredPropertyOnBase"u8);
            writer.WriteNumberValue(RequiredPropertyOnBase);
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
        }

        BaseModelWithDiscriminator IJsonModel<BaseModelWithDiscriminator>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BaseModelWithDiscriminator JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminator>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(BaseModelWithDiscriminator)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeBaseModelWithDiscriminator(document.RootElement, options);
        }

        internal static BaseModelWithDiscriminator DeserializeBaseModelWithDiscriminator(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string discriminatorProperty = default;
            string optionalPropertyOnBase = default;
            int requiredPropertyOnBase = default;
            IDictionary<string, BinaryData> serializedAdditionalRawData = default;
            Dictionary<string, BinaryData> rawDataDictionary = new Dictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("discriminatorProperty"u8))
                {
                    discriminatorProperty = prop.Value.GetString();
                    continue;
                }
                if (prop.NameEquals("optionalPropertyOnBase"u8))
                {
                    optionalPropertyOnBase = prop.Value.GetString();
                    continue;
                }
                if (prop.NameEquals("requiredPropertyOnBase"u8))
                {
                    requiredPropertyOnBase = prop.Value.GetInt32();
                    continue;
                }
                if (options.Format != "W")
                {
                    rawDataDictionary.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            serializedAdditionalRawData = rawDataDictionary;
            return new Models.BaseModelWithDiscriminator(discriminatorProperty, optionalPropertyOnBase, requiredPropertyOnBase, serializedAdditionalRawData);
        }

        BinaryData IPersistableModel<BaseModelWithDiscriminator>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminator>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(BaseModelWithDiscriminator)} does not support writing '{options.Format}' format.");
            }
        }

        BaseModelWithDiscriminator IPersistableModel<BaseModelWithDiscriminator>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BaseModelWithDiscriminator PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminator>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeBaseModelWithDiscriminator(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(BaseModelWithDiscriminator)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<BaseModelWithDiscriminator>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="baseModelWithDiscriminator"> The <see cref="BaseModelWithDiscriminator"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(BaseModelWithDiscriminator baseModelWithDiscriminator)
        {
            throw new NotImplementedException("Not implemented");
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="BaseModelWithDiscriminator"/> from. </param>
        public static explicit operator BaseModelWithDiscriminator(ClientResult result)
        {
            throw new NotImplementedException("Not implemented");
        }
    }
}
