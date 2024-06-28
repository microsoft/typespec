// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

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

        void IJsonModel<ProjectedModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ProjectedModel)} does not support writing '{format}' format.");
            }
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
        }

        ProjectedModel IJsonModel<ProjectedModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        internal static ProjectedModel JsonModelCreateCore(JsonElement element, ModelReaderWriterOptions options)
        {
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

        internal static ProjectedModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            JsonElement element = document.RootElement;
            return JsonModelCreateCore(element, options);
        }

        BinaryData IPersistableModel<ProjectedModel>.Write(ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        ProjectedModel IPersistableModel<ProjectedModel>.Create(BinaryData data, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        string IPersistableModel<ProjectedModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }
}
