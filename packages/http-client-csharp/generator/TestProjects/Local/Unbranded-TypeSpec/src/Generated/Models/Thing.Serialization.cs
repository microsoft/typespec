// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using UnbrandedTypeSpec;

namespace UnbrandedTypeSpec.Models
{
    /// <summary></summary>
    public partial class Thing : IJsonModel<Thing>
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        internal Thing(string name, BinaryData requiredUnion, ThingRequiredLiteralString requiredLiteralString, ThingRequiredLiteralInt requiredLiteralInt, ThingRequiredLiteralFloat requiredLiteralFloat, bool requiredLiteralBool, ThingOptionalLiteralString? optionalLiteralString, ThingOptionalLiteralInt? optionalLiteralInt, ThingOptionalLiteralFloat? optionalLiteralFloat, bool? optionalLiteralBool, string requiredBadDescription, IList<int> optionalNullableList, IList<int> requiredNullableList, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            Name = name;
            RequiredUnion = requiredUnion;
            RequiredLiteralString = requiredLiteralString;
            RequiredLiteralInt = requiredLiteralInt;
            RequiredLiteralFloat = requiredLiteralFloat;
            RequiredLiteralBool = requiredLiteralBool;
            OptionalLiteralString = optionalLiteralString;
            OptionalLiteralInt = optionalLiteralInt;
            OptionalLiteralFloat = optionalLiteralFloat;
            OptionalLiteralBool = optionalLiteralBool;
            RequiredBadDescription = requiredBadDescription;
            OptionalNullableList = optionalNullableList;
            RequiredNullableList = requiredNullableList;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        internal Thing()
        {
        }

        void IJsonModel<Thing>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Thing>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(Thing)} does not support writing '{format}' format.");
            }
            writer.WritePropertyName("name"u8);
            writer.WriteStringValue(Name);
            writer.WritePropertyName("requiredUnion"u8);
#if NET6_0_OR_GREATER
            writer.WriteRawValue(RequiredUnion);
#else
            using (JsonDocument document = JsonDocument.Parse(RequiredUnion))
            {
                JsonSerializer.Serialize(writer, document.RootElement);
            }
#endif
            writer.WritePropertyName("requiredLiteralString"u8);
            writer.WriteStringValue(RequiredLiteralString.ToString());
            writer.WritePropertyName("requiredLiteralInt"u8);
            writer.WriteNumberValue((int)RequiredLiteralInt);
            writer.WritePropertyName("requiredLiteralFloat"u8);
            writer.WriteNumberValue(RequiredLiteralFloat.ToSerialSingle());
            writer.WritePropertyName("requiredLiteralBool"u8);
            writer.WriteBooleanValue(RequiredLiteralBool);
            if (Optional.IsDefined(OptionalLiteralString))
            {
                writer.WritePropertyName("optionalLiteralString"u8);
                writer.WriteStringValue(OptionalLiteralString.Value.ToString());
            }
            if (Optional.IsDefined(OptionalLiteralInt))
            {
                writer.WritePropertyName("optionalLiteralInt"u8);
                writer.WriteNumberValue((int)OptionalLiteralInt.Value);
            }
            if (Optional.IsDefined(OptionalLiteralFloat))
            {
                writer.WritePropertyName("optionalLiteralFloat"u8);
                writer.WriteNumberValue(OptionalLiteralFloat.Value.ToSerialSingle());
            }
            if (Optional.IsDefined(OptionalLiteralBool))
            {
                writer.WritePropertyName("optionalLiteralBool"u8);
                writer.WriteBooleanValue(OptionalLiteralBool.Value);
            }
            writer.WritePropertyName("requiredBadDescription"u8);
            writer.WriteStringValue(RequiredBadDescription);
            if (Optional.IsCollectionDefined(OptionalNullableList))
            {
                if (OptionalNullableList != null)
                {
                    writer.WritePropertyName("optionalNullableList"u8);
                    writer.WriteStartArray();
                    foreach (var item in OptionalNullableList)
                    {
                        writer.WriteNumberValue(item);
                    }
                    writer.WriteEndArray();
                }
                else
                {
                    writer.WriteNull("optionalNullableList"u8);
                }
            }
            if (RequiredNullableList != null && Optional.IsCollectionDefined(RequiredNullableList))
            {
                writer.WritePropertyName("requiredNullableList"u8);
                writer.WriteStartArray();
                foreach (var item in RequiredNullableList)
                {
                    writer.WriteNumberValue(item);
                }
                writer.WriteEndArray();
            }
            else
            {
                writer.WriteNull("requiredNullableList"u8);
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

        Thing IJsonModel<Thing>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual Thing JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Thing>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(Thing)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeThing(document.RootElement, options);
        }

        internal static Thing DeserializeThing(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string name = default;
            BinaryData requiredUnion = default;
            ThingRequiredLiteralString requiredLiteralString = default;
            ThingRequiredLiteralInt requiredLiteralInt = default;
            ThingRequiredLiteralFloat requiredLiteralFloat = default;
            bool requiredLiteralBool = default;
            ThingOptionalLiteralString? optionalLiteralString = default;
            ThingOptionalLiteralInt? optionalLiteralInt = default;
            ThingOptionalLiteralFloat? optionalLiteralFloat = default;
            bool? optionalLiteralBool = default;
            string requiredBadDescription = default;
            IList<int> optionalNullableList = default;
            IList<int> requiredNullableList = default;
            IDictionary<string, BinaryData> serializedAdditionalRawData = default;
            Dictionary<string, BinaryData> rawDataDictionary = new Dictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("name"u8))
                {
                    name = prop.Value.GetString();
                    continue;
                }
                if (prop.NameEquals("requiredUnion"u8))
                {
                    requiredUnion = BinaryData.FromString(prop.Value.GetRawText());
                    continue;
                }
                if (prop.NameEquals("requiredLiteralString"u8))
                {
                    requiredLiteralString = new ThingRequiredLiteralStringExtensions(prop.Value.GetString());
                    continue;
                }
                if (prop.NameEquals("requiredLiteralInt"u8))
                {
                    requiredLiteralInt = new ThingRequiredLiteralIntExtensions(prop.Value.GetInt32());
                    continue;
                }
                if (prop.NameEquals("requiredLiteralFloat"u8))
                {
                    requiredLiteralFloat = new ThingRequiredLiteralFloatExtensions(prop.Value.GetSingle());
                    continue;
                }
                if (prop.NameEquals("requiredLiteralBool"u8))
                {
                    requiredLiteralBool = prop.Value.GetBoolean();
                    continue;
                }
                if (prop.NameEquals("optionalLiteralString"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        optionalLiteralString = null;
                        continue;
                    }
                    optionalLiteralString = new ThingOptionalLiteralStringExtensions(prop.Value.GetString());
                    continue;
                }
                if (prop.NameEquals("optionalLiteralInt"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        optionalLiteralInt = null;
                        continue;
                    }
                    optionalLiteralInt = new ThingOptionalLiteralIntExtensions(prop.Value.GetInt32());
                    continue;
                }
                if (prop.NameEquals("optionalLiteralFloat"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        optionalLiteralFloat = null;
                        continue;
                    }
                    optionalLiteralFloat = new ThingOptionalLiteralFloatExtensions(prop.Value.GetSingle());
                    continue;
                }
                if (prop.NameEquals("optionalLiteralBool"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        optionalLiteralBool = null;
                        continue;
                    }
                    optionalLiteralBool = prop.Value.GetBoolean();
                    continue;
                }
                if (prop.NameEquals("requiredBadDescription"u8))
                {
                    requiredBadDescription = prop.Value.GetString();
                    continue;
                }
                if (prop.NameEquals("optionalNullableList"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    List<int> array = new List<int>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(item.GetInt32());
                    }
                    optionalNullableList = array;
                    continue;
                }
                if (prop.NameEquals("requiredNullableList"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        requiredNullableList = new ChangeTrackingList<int>();
                        continue;
                    }
                    List<int> array = new List<int>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(item.GetInt32());
                    }
                    requiredNullableList = array;
                    continue;
                }
                if (options.Format != "W")
                {
                    rawDataDictionary.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            serializedAdditionalRawData = rawDataDictionary;
            return new Thing(
                name,
                requiredUnion,
                requiredLiteralString,
                requiredLiteralInt,
                requiredLiteralFloat,
                requiredLiteralBool,
                optionalLiteralString,
                optionalLiteralInt,
                optionalLiteralFloat,
                optionalLiteralBool,
                requiredBadDescription,
                optionalNullableList ?? new ChangeTrackingList<int>(),
                requiredNullableList,
                serializedAdditionalRawData);
        }

        BinaryData IPersistableModel<Thing>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Thing>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(Thing)} does not support writing '{options.Format}' format.");
            }
        }

        Thing IPersistableModel<Thing>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual Thing PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Thing>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeThing(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(Thing)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<Thing>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="thing"> The <see cref="Thing"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(Thing thing)
        {
            return BinaryContent.Create(thing, ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="Thing"/> from. </param>
        public static explicit operator Thing(ClientResult result)
        {
            using PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeThing(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
