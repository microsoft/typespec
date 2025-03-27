// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

namespace UnbrandedTypeSpec
{
    /// <summary></summary>
    public partial class RoundTripModel : IJsonModel<RoundTripModel>
    {
        internal RoundTripModel()
        {
        }

        void IJsonModel<RoundTripModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        /// <param name="writer"> The JSON writer. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RoundTripModel>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(RoundTripModel)} does not support writing '{format}' format.");
            }
            writer.WritePropertyName("requiredString"u8);
            writer.WriteStringValue(RequiredString);
            writer.WritePropertyName("requiredInt"u8);
            writer.WriteStringValue(RequiredInt.ToString());
            writer.WritePropertyName("requiredCollection"u8);
            writer.WriteStartArray();
            foreach (StringFixedEnum item in RequiredCollection)
            {
                writer.WriteStringValue(item.ToSerialString());
            }
            writer.WriteEndArray();
            writer.WritePropertyName("requiredDictionary"u8);
            writer.WriteStartObject();
            foreach (var item in RequiredDictionary)
            {
                writer.WritePropertyName(item.Key);
                writer.WriteStringValue(item.Value.ToString());
            }
            writer.WriteEndObject();
            writer.WritePropertyName("requiredModel"u8);
            writer.WriteObjectValue(RequiredModel, options);
            if (Optional.IsDefined(IntExtensibleEnum))
            {
                writer.WritePropertyName("intExtensibleEnum"u8);
                writer.WriteNumberValue(IntExtensibleEnum.Value.ToSerialInt32());
            }
            if (Optional.IsCollectionDefined(IntExtensibleEnumCollection))
            {
                writer.WritePropertyName("intExtensibleEnumCollection"u8);
                writer.WriteStartArray();
                foreach (IntExtensibleEnum item in IntExtensibleEnumCollection)
                {
                    writer.WriteNumberValue(item.ToSerialInt32());
                }
                writer.WriteEndArray();
            }
            if (Optional.IsDefined(FloatExtensibleEnum))
            {
                writer.WritePropertyName("floatExtensibleEnum"u8);
                writer.WriteNumberValue(FloatExtensibleEnum.Value.ToSerialSingle());
            }
            if (Optional.IsDefined(FloatExtensibleEnumWithIntValue))
            {
                writer.WritePropertyName("floatExtensibleEnumWithIntValue"u8);
                writer.WriteNumberValue(FloatExtensibleEnumWithIntValue.Value.ToSerialSingle());
            }
            if (Optional.IsCollectionDefined(FloatExtensibleEnumCollection))
            {
                writer.WritePropertyName("floatExtensibleEnumCollection"u8);
                writer.WriteStartArray();
                foreach (FloatExtensibleEnum item in FloatExtensibleEnumCollection)
                {
                    writer.WriteNumberValue(item.ToSerialSingle());
                }
                writer.WriteEndArray();
            }
            if (Optional.IsDefined(FloatFixedEnum))
            {
                writer.WritePropertyName("floatFixedEnum"u8);
                writer.WriteNumberValue(FloatFixedEnum.Value.ToSerialSingle());
            }
            if (Optional.IsDefined(FloatFixedEnumWithIntValue))
            {
                writer.WritePropertyName("floatFixedEnumWithIntValue"u8);
                writer.WriteNumberValue((int)FloatFixedEnumWithIntValue.Value);
            }
            if (Optional.IsCollectionDefined(FloatFixedEnumCollection))
            {
                writer.WritePropertyName("floatFixedEnumCollection"u8);
                writer.WriteStartArray();
                foreach (FloatFixedEnum item in FloatFixedEnumCollection)
                {
                    writer.WriteNumberValue(item.ToSerialSingle());
                }
                writer.WriteEndArray();
            }
            if (Optional.IsDefined(IntFixedEnum))
            {
                writer.WritePropertyName("intFixedEnum"u8);
                writer.WriteNumberValue((int)IntFixedEnum.Value);
            }
            if (Optional.IsCollectionDefined(IntFixedEnumCollection))
            {
                writer.WritePropertyName("intFixedEnumCollection"u8);
                writer.WriteStartArray();
                foreach (IntFixedEnum item in IntFixedEnumCollection)
                {
                    writer.WriteNumberValue((int)item);
                }
                writer.WriteEndArray();
            }
            if (Optional.IsDefined(StringFixedEnum))
            {
                writer.WritePropertyName("stringFixedEnum"u8);
                writer.WriteStringValue(StringFixedEnum.Value.ToSerialString());
            }
            writer.WritePropertyName("requiredUnknown"u8);
#if NET6_0_OR_GREATER
            writer.WriteRawValue(RequiredUnknown);
#else
            using (JsonDocument document = JsonDocument.Parse(RequiredUnknown))
            {
                JsonSerializer.Serialize(writer, document.RootElement);
            }
#endif
            if (Optional.IsDefined(OptionalUnknown))
            {
                writer.WritePropertyName("optionalUnknown"u8);
#if NET6_0_OR_GREATER
                writer.WriteRawValue(OptionalUnknown);
#else
                using (JsonDocument document = JsonDocument.Parse(OptionalUnknown))
                {
                    JsonSerializer.Serialize(writer, document.RootElement);
                }
#endif
            }
            writer.WritePropertyName("requiredRecordUnknown"u8);
            writer.WriteStartObject();
            foreach (var item in RequiredRecordUnknown)
            {
                writer.WritePropertyName(item.Key);
                if (item.Value == null)
                {
                    writer.WriteNullValue();
                    continue;
                }
#if NET6_0_OR_GREATER
                writer.WriteRawValue(item.Value);
#else
                using (JsonDocument document = JsonDocument.Parse(item.Value))
                {
                    JsonSerializer.Serialize(writer, document.RootElement);
                }
#endif
            }
            writer.WriteEndObject();
            if (Optional.IsCollectionDefined(OptionalRecordUnknown))
            {
                writer.WritePropertyName("optionalRecordUnknown"u8);
                writer.WriteStartObject();
                foreach (var item in OptionalRecordUnknown)
                {
                    writer.WritePropertyName(item.Key);
                    if (item.Value == null)
                    {
                        writer.WriteNullValue();
                        continue;
                    }
#if NET6_0_OR_GREATER
                    writer.WriteRawValue(item.Value);
#else
                    using (JsonDocument document = JsonDocument.Parse(item.Value))
                    {
                        JsonSerializer.Serialize(writer, document.RootElement);
                    }
#endif
                }
                writer.WriteEndObject();
            }
            if (options.Format != "W")
            {
                writer.WritePropertyName("readOnlyRequiredRecordUnknown"u8);
                writer.WriteStartObject();
                foreach (var item in ReadOnlyRequiredRecordUnknown)
                {
                    writer.WritePropertyName(item.Key);
                    if (item.Value == null)
                    {
                        writer.WriteNullValue();
                        continue;
                    }
#if NET6_0_OR_GREATER
                    writer.WriteRawValue(item.Value);
#else
                    using (JsonDocument document = JsonDocument.Parse(item.Value))
                    {
                        JsonSerializer.Serialize(writer, document.RootElement);
                    }
#endif
                }
                writer.WriteEndObject();
            }
            if (options.Format != "W" && Optional.IsCollectionDefined(ReadOnlyOptionalRecordUnknown))
            {
                writer.WritePropertyName("readOnlyOptionalRecordUnknown"u8);
                writer.WriteStartObject();
                foreach (var item in ReadOnlyOptionalRecordUnknown)
                {
                    writer.WritePropertyName(item.Key);
                    if (item.Value == null)
                    {
                        writer.WriteNullValue();
                        continue;
                    }
#if NET6_0_OR_GREATER
                    writer.WriteRawValue(item.Value);
#else
                    using (JsonDocument document = JsonDocument.Parse(item.Value))
                    {
                        JsonSerializer.Serialize(writer, document.RootElement);
                    }
#endif
                }
                writer.WriteEndObject();
            }
            writer.WritePropertyName("modelWithRequiredNullable"u8);
            writer.WriteObjectValue(ModelWithRequiredNullable, options);
            writer.WritePropertyName("requiredBytes"u8);
            writer.WriteBase64StringValue(RequiredBytes.ToArray(), "D");
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

        RoundTripModel IJsonModel<RoundTripModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        /// <param name="reader"> The JSON reader. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual RoundTripModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RoundTripModel>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(RoundTripModel)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeRoundTripModel(document.RootElement, options);
        }

        internal static RoundTripModel DeserializeRoundTripModel(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string requiredString = default;
            int requiredInt = default;
            IList<StringFixedEnum> requiredCollection = default;
            IDictionary<string, StringExtensibleEnum> requiredDictionary = default;
            Thing requiredModel = default;
            IntExtensibleEnum? intExtensibleEnum = default;
            IList<IntExtensibleEnum> intExtensibleEnumCollection = default;
            FloatExtensibleEnum? floatExtensibleEnum = default;
            FloatExtensibleEnumWithIntValue? floatExtensibleEnumWithIntValue = default;
            IList<FloatExtensibleEnum> floatExtensibleEnumCollection = default;
            FloatFixedEnum? floatFixedEnum = default;
            FloatFixedEnumWithIntValue? floatFixedEnumWithIntValue = default;
            IList<FloatFixedEnum> floatFixedEnumCollection = default;
            IntFixedEnum? intFixedEnum = default;
            IList<IntFixedEnum> intFixedEnumCollection = default;
            StringFixedEnum? stringFixedEnum = default;
            BinaryData requiredUnknown = default;
            BinaryData optionalUnknown = default;
            IDictionary<string, BinaryData> requiredRecordUnknown = default;
            IDictionary<string, BinaryData> optionalRecordUnknown = default;
            IReadOnlyDictionary<string, BinaryData> readOnlyRequiredRecordUnknown = default;
            IReadOnlyDictionary<string, BinaryData> readOnlyOptionalRecordUnknown = default;
            ModelWithRequiredNullableProperties modelWithRequiredNullable = default;
            BinaryData requiredBytes = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = new ChangeTrackingDictionary<string, BinaryData>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.NameEquals("requiredString"u8))
                {
                    requiredString = prop.Value.GetString();
                    continue;
                }
                if (prop.NameEquals("requiredInt"u8))
                {
                    requiredInt = int.Parse(prop.Value.GetString());
                    continue;
                }
                if (prop.NameEquals("requiredCollection"u8))
                {
                    List<StringFixedEnum> array = new List<StringFixedEnum>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(item.GetString().ToStringFixedEnum());
                    }
                    requiredCollection = array;
                    continue;
                }
                if (prop.NameEquals("requiredDictionary"u8))
                {
                    Dictionary<string, StringExtensibleEnum> dictionary = new Dictionary<string, StringExtensibleEnum>();
                    foreach (var prop0 in prop.Value.EnumerateObject())
                    {
                        dictionary.Add(prop0.Name, new StringExtensibleEnum(prop0.Value.GetString()));
                    }
                    requiredDictionary = dictionary;
                    continue;
                }
                if (prop.NameEquals("requiredModel"u8))
                {
                    requiredModel = Thing.DeserializeThing(prop.Value, options);
                    continue;
                }
                if (prop.NameEquals("intExtensibleEnum"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    intExtensibleEnum = new IntExtensibleEnum(prop.Value.GetInt32());
                    continue;
                }
                if (prop.NameEquals("intExtensibleEnumCollection"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    List<IntExtensibleEnum> array = new List<IntExtensibleEnum>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(new IntExtensibleEnum(item.GetInt32()));
                    }
                    intExtensibleEnumCollection = array;
                    continue;
                }
                if (prop.NameEquals("floatExtensibleEnum"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    floatExtensibleEnum = new FloatExtensibleEnum(prop.Value.GetSingle());
                    continue;
                }
                if (prop.NameEquals("floatExtensibleEnumWithIntValue"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    floatExtensibleEnumWithIntValue = new FloatExtensibleEnumWithIntValue(prop.Value.GetSingle());
                    continue;
                }
                if (prop.NameEquals("floatExtensibleEnumCollection"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    List<FloatExtensibleEnum> array = new List<FloatExtensibleEnum>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(new FloatExtensibleEnum(item.GetSingle()));
                    }
                    floatExtensibleEnumCollection = array;
                    continue;
                }
                if (prop.NameEquals("floatFixedEnum"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    floatFixedEnum = prop.Value.GetSingle().ToFloatFixedEnum();
                    continue;
                }
                if (prop.NameEquals("floatFixedEnumWithIntValue"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    floatFixedEnumWithIntValue = prop.Value.GetInt32().ToFloatFixedEnumWithIntValue();
                    continue;
                }
                if (prop.NameEquals("floatFixedEnumCollection"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    List<FloatFixedEnum> array = new List<FloatFixedEnum>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(item.GetSingle().ToFloatFixedEnum());
                    }
                    floatFixedEnumCollection = array;
                    continue;
                }
                if (prop.NameEquals("intFixedEnum"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    intFixedEnum = prop.Value.GetInt32().ToIntFixedEnum();
                    continue;
                }
                if (prop.NameEquals("intFixedEnumCollection"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    List<IntFixedEnum> array = new List<IntFixedEnum>();
                    foreach (var item in prop.Value.EnumerateArray())
                    {
                        array.Add(item.GetInt32().ToIntFixedEnum());
                    }
                    intFixedEnumCollection = array;
                    continue;
                }
                if (prop.NameEquals("stringFixedEnum"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    stringFixedEnum = prop.Value.GetString().ToStringFixedEnum();
                    continue;
                }
                if (prop.NameEquals("requiredUnknown"u8))
                {
                    requiredUnknown = BinaryData.FromString(prop.Value.GetRawText());
                    continue;
                }
                if (prop.NameEquals("optionalUnknown"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    optionalUnknown = BinaryData.FromString(prop.Value.GetRawText());
                    continue;
                }
                if (prop.NameEquals("requiredRecordUnknown"u8))
                {
                    Dictionary<string, BinaryData> dictionary = new Dictionary<string, BinaryData>();
                    foreach (var prop0 in prop.Value.EnumerateObject())
                    {
                        if (prop0.Value.ValueKind == JsonValueKind.Null)
                        {
                            dictionary.Add(prop0.Name, null);
                        }
                        else
                        {
                            dictionary.Add(prop0.Name, BinaryData.FromString(prop0.Value.GetRawText()));
                        }
                    }
                    requiredRecordUnknown = dictionary;
                    continue;
                }
                if (prop.NameEquals("optionalRecordUnknown"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    Dictionary<string, BinaryData> dictionary = new Dictionary<string, BinaryData>();
                    foreach (var prop0 in prop.Value.EnumerateObject())
                    {
                        if (prop0.Value.ValueKind == JsonValueKind.Null)
                        {
                            dictionary.Add(prop0.Name, null);
                        }
                        else
                        {
                            dictionary.Add(prop0.Name, BinaryData.FromString(prop0.Value.GetRawText()));
                        }
                    }
                    optionalRecordUnknown = dictionary;
                    continue;
                }
                if (prop.NameEquals("readOnlyRequiredRecordUnknown"u8))
                {
                    Dictionary<string, BinaryData> dictionary = new Dictionary<string, BinaryData>();
                    foreach (var prop0 in prop.Value.EnumerateObject())
                    {
                        if (prop0.Value.ValueKind == JsonValueKind.Null)
                        {
                            dictionary.Add(prop0.Name, null);
                        }
                        else
                        {
                            dictionary.Add(prop0.Name, BinaryData.FromString(prop0.Value.GetRawText()));
                        }
                    }
                    readOnlyRequiredRecordUnknown = dictionary;
                    continue;
                }
                if (prop.NameEquals("readOnlyOptionalRecordUnknown"u8))
                {
                    if (prop.Value.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }
                    Dictionary<string, BinaryData> dictionary = new Dictionary<string, BinaryData>();
                    foreach (var prop0 in prop.Value.EnumerateObject())
                    {
                        if (prop0.Value.ValueKind == JsonValueKind.Null)
                        {
                            dictionary.Add(prop0.Name, null);
                        }
                        else
                        {
                            dictionary.Add(prop0.Name, BinaryData.FromString(prop0.Value.GetRawText()));
                        }
                    }
                    readOnlyOptionalRecordUnknown = dictionary;
                    continue;
                }
                if (prop.NameEquals("modelWithRequiredNullable"u8))
                {
                    modelWithRequiredNullable = ModelWithRequiredNullableProperties.DeserializeModelWithRequiredNullableProperties(prop.Value, options);
                    continue;
                }
                if (prop.NameEquals("requiredBytes"u8))
                {
                    requiredBytes = BinaryData.FromBytes(prop.Value.GetBytesFromBase64("D"));
                    continue;
                }
                if (options.Format != "W")
                {
                    additionalBinaryDataProperties.Add(prop.Name, BinaryData.FromString(prop.Value.GetRawText()));
                }
            }
            return new RoundTripModel(
                requiredString,
                requiredInt,
                requiredCollection,
                requiredDictionary,
                requiredModel,
                intExtensibleEnum,
                intExtensibleEnumCollection ?? new ChangeTrackingList<IntExtensibleEnum>(),
                floatExtensibleEnum,
                floatExtensibleEnumWithIntValue,
                floatExtensibleEnumCollection ?? new ChangeTrackingList<FloatExtensibleEnum>(),
                floatFixedEnum,
                floatFixedEnumWithIntValue,
                floatFixedEnumCollection ?? new ChangeTrackingList<FloatFixedEnum>(),
                intFixedEnum,
                intFixedEnumCollection ?? new ChangeTrackingList<IntFixedEnum>(),
                stringFixedEnum,
                requiredUnknown,
                optionalUnknown,
                requiredRecordUnknown,
                optionalRecordUnknown ?? new ChangeTrackingDictionary<string, BinaryData>(),
                readOnlyRequiredRecordUnknown,
                readOnlyOptionalRecordUnknown ?? new ChangeTrackingDictionary<string, BinaryData>(),
                modelWithRequiredNullable,
                requiredBytes,
                additionalBinaryDataProperties);
        }

        BinaryData IPersistableModel<RoundTripModel>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RoundTripModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(RoundTripModel)} does not support writing '{options.Format}' format.");
            }
        }

        RoundTripModel IPersistableModel<RoundTripModel>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual RoundTripModel PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<RoundTripModel>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeRoundTripModel(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(RoundTripModel)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<RoundTripModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        /// <param name="roundTripModel"> The <see cref="RoundTripModel"/> to serialize into <see cref="BinaryContent"/>. </param>
        public static implicit operator BinaryContent(RoundTripModel roundTripModel)
        {
            if (roundTripModel == null)
            {
                return null;
            }
            return BinaryContent.Create(roundTripModel, ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="RoundTripModel"/> from. </param>
        public static explicit operator RoundTripModel(ClientResult result)
        {
            using PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeRoundTripModel(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
