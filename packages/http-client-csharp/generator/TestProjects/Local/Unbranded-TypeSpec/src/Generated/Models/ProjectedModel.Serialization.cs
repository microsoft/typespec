// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

namespace UnbrandedTypeSpec.Models
{
    public partial class ProjectedModel : System.ClientModel.Primitives.IJsonModel<ProjectedModel>
    {
        private IDictionary<string, System.BinaryData> _serializedAdditionalRawData;

        /// <summary> Initializes a new instance of <see cref="ProjectedModel"/>. </summary>
        /// <param name="name"> name of the ModelWithProjectedName. </param>
        /// <param name="serializedAdditionalRawData"> Keeps track of any properties unknown to the library. </param>
        internal ProjectedModel(string name, IDictionary<string, System.BinaryData> serializedAdditionalRawData)
        {
            Name = name;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        /// <summary> Initializes a new instance of <see cref="ProjectedModel"/> for deserialization. </summary>
        internal ProjectedModel()
        {
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        void System.ClientModel.Primitives.IJsonModel<ProjectedModel>.Write(System.Text.Json.Utf8JsonWriter writer, System.ClientModel.Primitives.ModelReaderWriterOptions options) => WriteCore(writer, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        ProjectedModel System.ClientModel.Primitives.IJsonModel<ProjectedModel>.Create(ref System.Text.Json.Utf8JsonReader reader, System.ClientModel.Primitives.ModelReaderWriterOptions options) => CreateCore(ref reader, options);

        /// <param name="options"> The client options for reading and writing models. </param>
        System.BinaryData System.ClientModel.Primitives.IPersistableModel<ProjectedModel>.Write(System.ClientModel.Primitives.ModelReaderWriterOptions options) => WriteCore(options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        ProjectedModel System.ClientModel.Primitives.IPersistableModel<ProjectedModel>.Create(System.BinaryData data, System.ClientModel.Primitives.ModelReaderWriterOptions options) => CreateCore(data, options);

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void WriteCore(System.Text.Json.Utf8JsonWriter writer, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((System.ClientModel.Primitives.IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
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

                        using (System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.Parse(item.Value))
                        {
                            System.Text.Json.JsonSerializer.Serialize(writer, document.RootElement);
                        }
                    #endif
                }
            }
            writer.WriteEndObject();
        }

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ProjectedModel CreateCore(ref System.Text.Json.Utf8JsonReader reader, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((System.ClientModel.Primitives.IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(ProjectedModel)} does not support reading '{format}' format.");
            }
            using System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.ParseValue(ref reader);
            return ProjectedModel.DeserializeProjectedModel(document.RootElement, options);
        }

        /// <param name="element"> The JSON element to deserialize. </param>
        /// <param name="options"> The client options. </param>
        internal static ProjectedModel DeserializeProjectedModel(System.Text.Json.JsonElement element, System.ClientModel.Primitives.ModelReaderWriterOptions options = null)
        {
            options ??= new System.ClientModel.Primitives.ModelReaderWriterOptions("W");

            if (element.ValueKind == System.Text.Json.JsonValueKind.Null)
            {
                return null;
            }
            string name = default;
            IDictionary<string, System.BinaryData> serializedAdditionalRawData = default;
            Dictionary<string, System.BinaryData> rawDataDictionary = new Dictionary<string, System.BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("name"u8))
                {
                    name = prop.Value.GetString();
                    continue;
                }
                if (options.Format != "W")
                {
                    rawDataDictionary.Add(prop.Name, System.BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            serializedAdditionalRawData = rawDataDictionary;
            return new ProjectedModel(name, serializedAdditionalRawData);
        }

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual System.BinaryData WriteCore(System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((System.ClientModel.Primitives.IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J": 
                    return System.ClientModel.Primitives.ModelReaderWriter.Write(this, options);
                default: 
                    throw new FormatException($"The model {nameof(ProjectedModel)} does not support writing '{options.Format}' format.");
            }
        }

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ProjectedModel CreateCore(System.BinaryData data, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((System.ClientModel.Primitives.IPersistableModel<ProjectedModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J": 
                {
                    using System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.Parse(data);
                    return ProjectedModel.DeserializeProjectedModel(document.RootElement, options);
                }
                default: 
                    throw new FormatException($"The model {nameof(ProjectedModel)} does not support reading '{options.Format}' format.");
            }
        }

        /// <param name="options"> The client options for reading and writing models. </param>
        string System.ClientModel.Primitives.IPersistableModel<ProjectedModel>.GetFormatFromOptions(System.ClientModel.Primitives.ModelReaderWriterOptions options) => "J";

        /// <summary> Deserializes the model from a raw response. </summary>
        /// <param name="response"> The result to deserialize the model from. </param>
        internal static ProjectedModel FromResponse(System.ClientModel.Primitives.PipelineResponse response)
        {
            using var document = System.Text.Json.JsonDocument.Parse(response.Content);
            return ProjectedModel.DeserializeProjectedModel(document.RootElement);
        }

        /// <summary> Convert into a <see cref="System.ClientModel.BinaryContent"/>. </summary>
        internal virtual System.ClientModel.BinaryContent ToBinaryContent()
        {
            return System.ClientModel.BinaryContent.Create<ProjectedModel>(this, new System.ClientModel.Primitives.ModelReaderWriterOptions("W"));
        }
    }
}
