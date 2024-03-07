// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using Azure;
using Azure.Core;
using ModelsTypeSpec;

namespace ModelsTypeSpec.Models
{
    internal partial class UnknownBaseModelWithDiscriminatorDefinedOnBase : IUtf8JsonSerializable, IJsonModel<BaseModelWithDiscriminatorDefinedOnBase>
    {
        void IUtf8JsonSerializable.Write(Utf8JsonWriter writer) => ((IJsonModel<BaseModelWithDiscriminatorDefinedOnBase>)this).Write(writer, new ModelReaderWriterOptions("W"));

        void IJsonModel<BaseModelWithDiscriminatorDefinedOnBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminatorDefinedOnBase>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(BaseModelWithDiscriminatorDefinedOnBase)} does not support '{format}' format.");
            }

            writer.WriteStartObject();
            if (Optional.IsDefined(OptionalString))
            {
                writer.WritePropertyName("optionalString"u8);
                writer.WriteStringValue(OptionalString);
            }
            writer.WritePropertyName("kind"u8);
            writer.WriteStringValue(Kind);
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

        BaseModelWithDiscriminatorDefinedOnBase IJsonModel<BaseModelWithDiscriminatorDefinedOnBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminatorDefinedOnBase>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(BaseModelWithDiscriminatorDefinedOnBase)} does not support '{format}' format.");
            }

            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeBaseModelWithDiscriminatorDefinedOnBase(document.RootElement, options);
        }

        internal static UnknownBaseModelWithDiscriminatorDefinedOnBase DeserializeUnknownBaseModelWithDiscriminatorDefinedOnBase(JsonElement element, ModelReaderWriterOptions options = null)
        {
            options ??= new ModelReaderWriterOptions("W");

            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string optionalString = default;
            string kind = "Unknown";
            IDictionary<string, BinaryData> serializedAdditionalRawData = default;
            Dictionary<string, BinaryData> additionalPropertiesDictionary = new Dictionary<string, BinaryData>();
            foreach (var property in element.EnumerateObject())
            {
                if (property.NameEquals("optionalString"u8))
                {
                    optionalString = property.Value.GetString();
                    continue;
                }
                if (property.NameEquals("kind"u8))
                {
                    kind = property.Value.GetString();
                    continue;
                }
                if (options.Format != "W")
                {
                    additionalPropertiesDictionary.Add(property.Name, BinaryData.FromString(property.Value.GetRawText()));
                }
            }
            serializedAdditionalRawData = additionalPropertiesDictionary;
            return new UnknownBaseModelWithDiscriminatorDefinedOnBase(kind, serializedAdditionalRawData, optionalString);
        }

        BinaryData IPersistableModel<BaseModelWithDiscriminatorDefinedOnBase>.Write(ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminatorDefinedOnBase>)this).GetFormatFromOptions(options) : options.Format;

            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(BaseModelWithDiscriminatorDefinedOnBase)} does not support '{options.Format}' format.");
            }
        }

        BaseModelWithDiscriminatorDefinedOnBase IPersistableModel<BaseModelWithDiscriminatorDefinedOnBase>.Create(BinaryData data, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<BaseModelWithDiscriminatorDefinedOnBase>)this).GetFormatFromOptions(options) : options.Format;

            switch (format)
            {
                case "J":
                    {
                        using JsonDocument document = JsonDocument.Parse(data);
                        return DeserializeBaseModelWithDiscriminatorDefinedOnBase(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(BaseModelWithDiscriminatorDefinedOnBase)} does not support '{options.Format}' format.");
            }
        }

        string IPersistableModel<BaseModelWithDiscriminatorDefinedOnBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <summary> Deserializes the model from a raw response. </summary>
        /// <param name="response"> The response to deserialize the model from. </param>
        internal static new UnknownBaseModelWithDiscriminatorDefinedOnBase FromResponse(Response response)
        {
            using var document = JsonDocument.Parse(response.Content);
            return DeserializeUnknownBaseModelWithDiscriminatorDefinedOnBase(document.RootElement);
        }

        /// <summary> Convert into a Utf8JsonRequestContent. </summary>
        internal override RequestContent ToRequestContent()
        {
            var content = new Utf8JsonRequestContent();
            content.JsonWriter.WriteObjectValue(this);
            return content;
        }
    }
}
