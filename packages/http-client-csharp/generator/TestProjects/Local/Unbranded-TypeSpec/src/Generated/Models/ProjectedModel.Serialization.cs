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
    public partial class ProjectedModel : IJsonModel<ProjectedModel>
    {
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        internal ProjectedModel(string name, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            Name = name;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        internal ProjectedModel()
        {
        }

        void IJsonModel<ProjectedModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => WriteCore(writer, options);

        ProjectedModel IJsonModel<ProjectedModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => CreateCore(ref reader, options);

        BinaryData IPersistableModel<ProjectedModel>.Write(ModelReaderWriterOptions options) => WriteCore(options);

        ProjectedModel IPersistableModel<ProjectedModel>.Create(BinaryData data, ModelReaderWriterOptions options) => CreateCore(data, options);

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void WriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ProjectedModel)} does not support writing '{format}' format.");
            }
            writer.WriteStartObject();
            writer.WritePropertyName("name"u8);
            writer.WriteStringValue(Name);
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
        protected virtual ProjectedModel CreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ProjectedModel)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeProjectedModel(document.RootElement, options);
        }

        internal static ProjectedModel DeserializeProjectedModel(JsonElement element, ModelReaderWriterOptions options = null)
        {
            options ??= ModelSerializationExtensions.WireOptions;

            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string name = default;
            IDictionary<string, BinaryData> serializedAdditionalRawData = default;
            Dictionary<string, BinaryData> rawDataDictionary = new Dictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("name"u8))
                {
                    name = prop.Value.GetString();
                    continue;
                }
                if (options.Format != "W")
                {
                    rawDataDictionary.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            serializedAdditionalRawData = rawDataDictionary;
            return new ProjectedModel(name, serializedAdditionalRawData);
        }

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData WriteCore(ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(ProjectedModel)} does not support writing '{options.Format}' format.");
            }
        }

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ProjectedModel CreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J": 
                {
                    using JsonDocument document = JsonDocument.Parse(data);
                    return DeserializeProjectedModel(document.RootElement, options);
                }
                default:
                    throw new FormatException($"The model {nameof(ProjectedModel)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ProjectedModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        internal static ProjectedModel FromResponse(PipelineResponse response)
        {
            using var document = JsonDocument.Parse(response.Content);
            return DeserializeProjectedModel(document.RootElement);
        }

        internal virtual BinaryContent ToBinaryContent()
        {
            return BinaryContent.Create(this, ModelSerializationExtensions.WireOptions);
        }
    }
}
