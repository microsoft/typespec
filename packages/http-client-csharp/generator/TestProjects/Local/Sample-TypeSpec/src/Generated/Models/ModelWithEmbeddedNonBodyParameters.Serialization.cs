// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

namespace SampleTypeSpec
{
    /// <summary></summary>
    public partial class ModelWithEmbeddedNonBodyParameters : IJsonModel<ModelWithEmbeddedNonBodyParameters>
    {
        internal ModelWithEmbeddedNonBodyParameters()
        {
        }

        void IJsonModel<ModelWithEmbeddedNonBodyParameters>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ModelWithEmbeddedNonBodyParameters>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ModelWithEmbeddedNonBodyParameters)} does not support writing '{format}' format.");
            }
            writer.WritePropertyName("name"u8);
            writer.WriteStringValue(Name);
            if (options.Format != "W" && _additionalBinaryDataProperties != null)
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

        ModelWithEmbeddedNonBodyParameters IJsonModel<ModelWithEmbeddedNonBodyParameters>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ModelWithEmbeddedNonBodyParameters JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ModelWithEmbeddedNonBodyParameters>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ModelWithEmbeddedNonBodyParameters)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeModelWithEmbeddedNonBodyParameters(document.RootElement, options);
        }

        internal static ModelWithEmbeddedNonBodyParameters DeserializeModelWithEmbeddedNonBodyParameters(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string name = default;
            string requiredHeader = default;
            string optionalHeader = default;
            string requiredQuery = default;
            string optionalQuery = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = new ChangeTrackingDictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("name"u8))
                {
                    name = prop.Value.GetString();
                    continue;
                }
                if (options.Format != "W")
                {
                    additionalBinaryDataProperties.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            return new ModelWithEmbeddedNonBodyParameters(
                name,
                requiredHeader,
                optionalHeader,
                requiredQuery,
                optionalQuery,
                additionalBinaryDataProperties);
        }

        BinaryData IPersistableModel<ModelWithEmbeddedNonBodyParameters>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ModelWithEmbeddedNonBodyParameters>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(ModelWithEmbeddedNonBodyParameters)} does not support writing '{options.Format}' format.");
            }
        }

        ModelWithEmbeddedNonBodyParameters IPersistableModel<ModelWithEmbeddedNonBodyParameters>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ModelWithEmbeddedNonBodyParameters PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ModelWithEmbeddedNonBodyParameters>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeModelWithEmbeddedNonBodyParameters(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(ModelWithEmbeddedNonBodyParameters)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ModelWithEmbeddedNonBodyParameters>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="modelWithEmbeddedNonBodyParameters"> The <see cref="ModelWithEmbeddedNonBodyParameters"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(ModelWithEmbeddedNonBodyParameters modelWithEmbeddedNonBodyParameters)
        {
            if (modelWithEmbeddedNonBodyParameters == null)
            {
                return null;
            }
            return BinaryContent.Create(modelWithEmbeddedNonBodyParameters, ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="ModelWithEmbeddedNonBodyParameters"/> from. </param>
        public static explicit operator ModelWithEmbeddedNonBodyParameters(ClientResult result)
        {
            using PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeModelWithEmbeddedNonBodyParameters(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
