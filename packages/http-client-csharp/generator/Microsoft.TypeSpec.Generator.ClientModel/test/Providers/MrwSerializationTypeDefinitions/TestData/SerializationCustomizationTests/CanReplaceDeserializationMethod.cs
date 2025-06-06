// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;
using Sample;

namespace Sample.Models
{
    public partial class MockInputModel : global::System.ClientModel.Primitives.IJsonModel<global::Sample.Models.MockInputModel>
    {
        void global::System.ClientModel.Primitives.IJsonModel<global::Sample.Models.MockInputModel>.Write(global::System.Text.Json.Utf8JsonWriter writer, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            this.JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

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
                writer.WriteStringValue(Prop1);
            }
            if (global::Sample.Optional.IsDefined(Prop2))
            {
                writer.WritePropertyName("prop2"u8);
                writer.WriteStringValue(Prop2);
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

        global::System.BinaryData global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>.Write(global::System.ClientModel.Primitives.ModelReaderWriterOptions options) => this.PersistableModelWriteCore(options);

        protected virtual global::System.BinaryData PersistableModelWriteCore(global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            string format = (options.Format == "W") ? ((global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return global::System.ClientModel.Primitives.ModelReaderWriter.Write(this, options, global::Sample.SampleContext.Default);
                default:
                    throw new global::System.FormatException($"The model {nameof(global::Sample.Models.MockInputModel)} does not support writing '{options.Format}' format.");
            }
        }

        global::Sample.Models.MockInputModel global::System.ClientModel.Primitives.IPersistableModel<global::Sample.Models.MockInputModel>.Create(global::System.BinaryData data, global::System.ClientModel.Primitives.ModelReaderWriterOptions options) => this.PersistableModelCreateCore(data, options);

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
    }
}
