// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using Payload.Pageable;

namespace Payload.Pageable._ServerDrivenPagination.ContinuationToken
{
    /// <summary></summary>
    public partial class RequestQueryResponseBodyResponse : IJsonModel<RequestQueryResponseBodyResponse>
    {
        internal RequestQueryResponseBodyResponse()
        {
        }

        void IJsonModel<RequestQueryResponseBodyResponse>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RequestQueryResponseBodyResponse>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(RequestQueryResponseBodyResponse)} does not support writing '{format}' format.");
            }
            writer.WritePropertyName("pets"u8);
            writer.WriteStartArray();
            foreach (Pet item in Pets)
            {
                writer.WriteObjectValue(item, options);
            }
            writer.WriteEndArray();
            if (Optional.IsDefined(NextToken))
            {
                writer.WritePropertyName("nextToken"u8);
                writer.WriteStringValue(NextToken);
            }
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

        RequestQueryResponseBodyResponse IJsonModel<RequestQueryResponseBodyResponse>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual RequestQueryResponseBodyResponse JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RequestQueryResponseBodyResponse>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(RequestQueryResponseBodyResponse)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeRequestQueryResponseBodyResponse(document.RootElement, options);
        }

        internal static RequestQueryResponseBodyResponse DeserializeRequestQueryResponseBodyResponse(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            IList<Pet> pets = default;
            string nextToken = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = new ChangeTrackingDictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("pets"u8))
                {
                    List<Pet> array = new List<Pet>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(Pet.DeserializePet(item, options));
                    }
                    pets = array;
                    continue;
                }
                if (prop.NameEquals("nextToken"u8))
                {
                    nextToken = prop.Value.GetString();
                    continue;
                }
                if (options.Format != "W")
                {
                    additionalBinaryDataProperties.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            return new RequestQueryResponseBodyResponse(pets, nextToken, additionalBinaryDataProperties);
        }

        BinaryData IPersistableModel<RequestQueryResponseBodyResponse>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RequestQueryResponseBodyResponse>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(RequestQueryResponseBodyResponse)} does not support writing '{options.Format}' format.");
            }
        }

        RequestQueryResponseBodyResponse IPersistableModel<RequestQueryResponseBodyResponse>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual RequestQueryResponseBodyResponse PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RequestQueryResponseBodyResponse>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeRequestQueryResponseBodyResponse(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(RequestQueryResponseBodyResponse)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<RequestQueryResponseBodyResponse>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="requestQueryResponseBodyResponse"> The <see cref="RequestQueryResponseBodyResponse"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(RequestQueryResponseBodyResponse requestQueryResponseBodyResponse)
        {
            if (requestQueryResponseBodyResponse == null)
            {
                return null;
            }
            return BinaryContent.Create(requestQueryResponseBodyResponse, ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="RequestQueryResponseBodyResponse"/> from. </param>
        public static explicit operator RequestQueryResponseBodyResponse(ClientResult result)
        {
            using PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeRequestQueryResponseBodyResponse(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
