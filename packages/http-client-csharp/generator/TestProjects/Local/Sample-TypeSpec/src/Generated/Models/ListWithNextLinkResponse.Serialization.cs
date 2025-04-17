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
    internal partial class ListWithNextLinkResponse : IJsonModel<ListWithNextLinkResponse>
    {
        internal ListWithNextLinkResponse()
        {
        }

        void IJsonModel<ListWithNextLinkResponse>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ListWithNextLinkResponse>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ListWithNextLinkResponse)} does not support writing '{format}' format.");
            }
            writer.WritePropertyName("things"u8);
            writer.WriteStartArray();
            foreach (Thing item in Things)
            {
                writer.WriteObjectValue(item, options);
            }
            writer.WriteEndArray();
            if (Optional.IsDefined(Next))
            {
                writer.WritePropertyName("next"u8);
                writer.WriteStringValue(Next.AbsoluteUri);
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

        ListWithNextLinkResponse IJsonModel<ListWithNextLinkResponse>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ListWithNextLinkResponse JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ListWithNextLinkResponse>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ListWithNextLinkResponse)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeListWithNextLinkResponse(document.RootElement, options);
        }

        internal static ListWithNextLinkResponse DeserializeListWithNextLinkResponse(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            IList<Thing> things = default;
            Uri next = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = new ChangeTrackingDictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("things"u8))
                {
                    List<Thing> array = new List<Thing>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(Thing.DeserializeThing(item, options));
                    }
                    things = array;
                    continue;
                }
                if (prop.NameEquals("next"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    next = new Uri(prop.Value.GetString());
                    continue;
                }
                if (options.Format != "W")
                {
                    additionalBinaryDataProperties.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            return new ListWithNextLinkResponse(things, next, additionalBinaryDataProperties);
        }

        BinaryData IPersistableModel<ListWithNextLinkResponse>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ListWithNextLinkResponse>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(ListWithNextLinkResponse)} does not support writing '{options.Format}' format.");
            }
        }

        ListWithNextLinkResponse IPersistableModel<ListWithNextLinkResponse>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ListWithNextLinkResponse PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ListWithNextLinkResponse>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeListWithNextLinkResponse(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(ListWithNextLinkResponse)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ListWithNextLinkResponse>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="listWithNextLinkResponse"> The <see cref="ListWithNextLinkResponse"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(ListWithNextLinkResponse listWithNextLinkResponse)
        {
            if (listWithNextLinkResponse == null)
            {
                return null;
            }
            return BinaryContent.Create(listWithNextLinkResponse, ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="ListWithNextLinkResponse"/> from. </param>
        public static explicit operator ListWithNextLinkResponse(ClientResult result)
        {
            using PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeListWithNextLinkResponse(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
