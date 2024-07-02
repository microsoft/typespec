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

        void IJsonModel<ModelWithRequiredNullableProperties>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ModelWithRequiredNullableProperties>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ModelWithRequiredNullableProperties)} does not support writing '{format}' format.");
            }
            if (RequiredNullablePrimitive != null)
            {
                writer.WritePropertyName("requiredNullablePrimitive"u8);
                writer.WriteNumberValue(RequiredNullablePrimitive.Value);
            }
            else
            {
                writer.WriteNull("requiredNullablePrimitive"u8);
            }
            if (RequiredExtensibleEnum != null)
            {
                writer.WritePropertyName("requiredExtensibleEnum"u8);
                writer.WriteStringValue(RequiredExtensibleEnum.Value.ToString());
            }
            else
            {
                writer.WriteNull("requiredExtensibleEnum"u8);
            }
            if (RequiredFixedEnum != null)
            {
                writer.WritePropertyName("requiredFixedEnum"u8);
                writer.WriteStringValue(RequiredFixedEnum.Value.ToSerialString());
            }
            else
            {
                writer.WriteNull("requiredFixedEnum"u8);
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

        ModelWithRequiredNullableProperties IJsonModel<ModelWithRequiredNullableProperties>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ModelWithRequiredNullableProperties JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        BinaryData IPersistableModel<ModelWithRequiredNullableProperties>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ModelWithRequiredNullableProperties>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(ModelWithRequiredNullableProperties)} does not support writing '{options.Format}' format.");
            }
        }

        ModelWithRequiredNullableProperties IPersistableModel<ModelWithRequiredNullableProperties>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ModelWithRequiredNullableProperties PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ModelWithRequiredNullableProperties>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return ModelWithRequiredNullableProperties.DeserializeModelWithRequiredNullableProperties(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(ModelWithRequiredNullableProperties)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ModelWithRequiredNullableProperties>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="modelWithRequiredNullableProperties"> The <see cref="ModelWithRequiredNullableProperties"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(ModelWithRequiredNullableProperties modelWithRequiredNullableProperties)
        {
            throw new NotImplementedException("Not implemented");
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="ModelWithRequiredNullableProperties"/> from. </param>
        public static explicit operator ModelWithRequiredNullableProperties(ClientResult result)
        {
            throw new NotImplementedException("Not implemented");
        }
    }
}
