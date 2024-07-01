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
    public partial class Friend : IJsonModel<Friend>
    {
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        internal Friend(string name, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            Name = name;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        internal Friend()
        {
        }

        void IJsonModel<Friend>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Friend>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(Friend)} does not support writing '{format}' format.");
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

        Friend IJsonModel<Friend>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual Friend JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            JsonElement element = document.RootElement;

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
            return new Friend(name, serializedAdditionalRawData);
        }

        BinaryData IPersistableModel<Friend>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Friend>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(Friend)} does not support writing '{options.Format}' format.");
            }
        }

        Friend IPersistableModel<Friend>.Create(BinaryData data, ModelReaderWriterOptions options)
        {
            throw new NotImplementedException("Not implemented");
        }

        string IPersistableModel<Friend>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        private static object GetObjectInstance(Type returnType)
        {
            PersistableModelProxyAttribute attribute = Attribute.GetCustomAttribute(returnType, typeof(PersistableModelProxyAttribute), false) as PersistableModelProxyAttribute;
            Type typeToActivate = attribute is null ? returnType : attribute.ProxyType;

            if (returnType.IsAbstract && attribute is null)
            {
                throw new InvalidOperationException($"{returnType.Name} must be decorated with {nameof(PersistableModelProxyAttribute)} to be used with {nameof(ModelReaderWriter)}.");
            }

            object obj = Activator.CreateInstance(typeToActivate, true);
            if (obj is null)
            {
                throw new InvalidOperationException($"Unable to create instance of {typeToActivate.Name}.");
            }
            return obj;
        }

        /// <param name="friend"> The <see cref="Friend"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(Friend friend)
        {
            throw new NotImplementedException("Not implemented");
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="Friend"/> from. </param>
        public static explicit operator Friend(ClientResult result)
        {
            throw new NotImplementedException("Not implemented");
        }
    }
}
