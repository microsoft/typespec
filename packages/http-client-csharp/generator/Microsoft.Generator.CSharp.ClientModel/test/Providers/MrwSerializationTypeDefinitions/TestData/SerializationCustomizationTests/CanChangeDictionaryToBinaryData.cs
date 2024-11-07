// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using Sample;

namespace Sample.Models
{
    /// <summary></summary>
    public partial class MockInputModel : global::System.ClientModel.Primitives.IJsonModel<global::Sample.Models.MockInputModel>
    {
        void global::System.ClientModel.Primitives.IJsonModel<global::Sample.Models.MockInputModel>.Write(global::System.Text.Json.Utf8JsonWriter writer, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            this.JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(global::System.Text.Json.Utf8JsonWriter writer, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>)this).GetFormatFromOptions(options) : options.Format;
            if ((format != "J"))
            {
                throw new global::System.FormatException($"The model {nameof(global::Sample.Models.MockInputModel)} does not support writing '{format}' format.");
            }
            if (global::Sample.Optional.IsDefined(Prop1))
            {
                writer.WritePropertyName("prop1"u8);
#if NET6_0_OR_GREATER
                writer.WriteRawValue(Prop1);
#else
                using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(Prop1))
                {
                    global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
                }
#endif
            }
            if (((options.Format != "W") && (_additionalBinaryDataProperties != null)))
            {
                foreach (var item in _additionalBinaryDataProperties)
                {
                    writer.WritePropertyName(item.Key);
#if NET6_0_OR_GREATER
                    writer.WriteRawValue(item.Value);
#else
                    using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(item.Value))
                    {
                        global::System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
                    }
#endif
                }
            }
        }

        global::Sample.Models.MockInputModel global::System.ClientModel.Primitives.IJsonModel<global::Sample.Models.MockInputModel>.Create(ref global::System.Text.Json.Utf8JsonReader reader, global::System.ClientModel.Primitives.ModelReaderWriterOptions options) => this.JsonModelCreateCore(ref reader, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual global::Sample.Models.MockInputModel JsonModelCreateCore(ref global::System.Text.Json.Utf8JsonReader reader, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>)this).GetFormatFromOptions(options) : options.Format;
            if ((format != "J"))
            {
                throw new global::System.FormatException($"The model {nameof(global::Sample.Models.MockInputModel)} does not support reading '{format}' format.");
            }
            using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.ParseValue(ref reader);
            return global::Sample.Models.MockInputModel.DeserializeMockInputModel(document.RootElement, options);
        }

        internal static global::Sample.Models.MockInputModel DeserializeMockInputModel(global::System.Text.Json.JsonElement element, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            if ((element.ValueKind == global::System.Text.Json.JsonValueKind.Null))
            {
                return null;
            }
            global::System.BinaryData prop1 = default;
            global::System.Collections.Generic.IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("prop1"u8))
                {
                    if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))
                    {
                        continue;
                    }
                    prop1 = global::System.BinaryData.FromString(prop.Value.GetRawText());
                    continue;
                }
                if ((options.Format != "W"))
                {
                    additionalBinaryDataProperties.Add(prop.Name, global::System.BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            return new global::Sample.Models.MockInputModel(prop1, additionalBinaryDataProperties);
        }

        global::System.BinaryData global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>.Write(global::System.ClientModel.Primitives.ModelReaderWriterOptions options) => this.PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual global::System.BinaryData PersistableModelWriteCore(global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return global::System.ClientModel.Primitives.ModelReaderWriter.Write(this, options);
                default:
                    throw new global::System.FormatException($"The model {nameof(global::Sample.Models.MockInputModel)} does not support writing '{options.Format}' format.");
            }
        }

        global::Sample.Models.MockInputModel global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>.Create(global::System.BinaryData data, global::System.ClientModel.Primitives.ModelReaderWriterOptions options) => this.PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual global::Sample.Models.MockInputModel PersistableModelCreateCore(global::System.BinaryData data, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(data))
                    {
                        return global::Sample.Models.MockInputModel.DeserializeMockInputModel(document.RootElement, options);
                    }
                default:
                    throw new global::System.FormatException($"The model {nameof(global::Sample.Models.MockInputModel)} does not support reading '{options.Format}' format.");
            }
        }

        string global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>.GetFormatFromOptions(global::System.ClientModel.Primitives.ModelReaderWriterOptions options) => "J";

        /// <param name="mockInputModel"> The <see cref="global::Sample.Models.MockInputModel"/> to serialize into <see cref="global::System.ClientModel.BinaryContent"/>. </param>
        public static implicit operator BinaryContent(global::Sample.Models.MockInputModel mockInputModel)
        {
            if ((mockInputModel == null))
            {
                return null;
            }
            return global::System.ClientModel.BinaryContent.Create(mockInputModel, global::Sample.ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="global::System.ClientModel.ClientResult"/> to deserialize the <see cref="global::Sample.Models.MockInputModel"/> from. </param>
        public static explicit operator MockInputModel(global::System.ClientModel.ClientResult result)
        {
            using global::System.ClientModel.Primitives.PipelineResponse response = result.GetRawResponse();
            using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(response.Content);
            return global::Sample.Models.MockInputModel.DeserializeMockInputModel(document.RootElement, global::Sample.ModelSerializationExtensions.WireOptions);
        }
    }
}
