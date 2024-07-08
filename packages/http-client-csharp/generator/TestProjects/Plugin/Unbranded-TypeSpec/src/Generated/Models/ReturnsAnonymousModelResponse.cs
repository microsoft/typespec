// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

namespace UnbrandedTypeSpec.Models
{
    /// <summary></summary>
    public partial class ReturnsAnonymousModelResponse : IJsonModel<ReturnsAnonymousModelResponse>
    {
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        internal ReturnsAnonymousModelResponse(IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        void IJsonModel<ReturnsAnonymousModelResponse>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ReturnsAnonymousModelResponse>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ReturnsAnonymousModelResponse)} does not support writing '{format}' format.");
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
        }

        ReturnsAnonymousModelResponse IJsonModel<ReturnsAnonymousModelResponse>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        internal static ReturnsAnonymousModelResponse DeserializeReturnsAnonymousModelResponse(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            IDictionary<string, BinaryData> serializedAdditionalRawData = default;
            Dictionary<string, BinaryData> rawDataDictionary = new Dictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (options.Format != "W")
                {
                    rawDataDictionary.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            serializedAdditionalRawData = rawDataDictionary;
            return new ReturnsAnonymousModelResponse(serializedAdditionalRawData);
        }

        BinaryData IPersistableModel<ReturnsAnonymousModelResponse>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ReturnsAnonymousModelResponse>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(ReturnsAnonymousModelResponse)} does not support writing '{options.Format}' format.");
            }
        }

        ReturnsAnonymousModelResponse IPersistableModel<ReturnsAnonymousModelResponse>.Create(BinaryData data, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        string IPersistableModel<ReturnsAnonymousModelResponse>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="returnsAnonymousModelResponse"> The <see cref="ReturnsAnonymousModelResponse"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(ReturnsAnonymousModelResponse returnsAnonymousModelResponse)
        {
            throw new NotImplementedException("Not implemented");
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="ReturnsAnonymousModelResponse"/> from. </param>
        public static explicit operator ReturnsAnonymousModelResponse(ClientResult result)
        {
            throw new NotImplementedException("Not implemented");
        }
    }
}
