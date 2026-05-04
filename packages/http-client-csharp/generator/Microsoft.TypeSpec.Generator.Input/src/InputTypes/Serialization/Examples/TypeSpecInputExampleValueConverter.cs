// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputExampleValueConverter : JsonConverter<InputExampleValue>
    {
        private const string KindPropertyName = "kind";
        private const string TypePropertyName = "type";
        private const string ValuePropertyName = "value";

        public override InputExampleValue? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateExampleValue(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputExampleValue value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputExampleValue CreateExampleValue(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }
            string? id = null;
            string? kind = null;
            InputExampleValue? result = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrKind = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString(KindPropertyName, ref kind);

                if (isIdOrKind)
                {
                    continue;
                }
                result = CreateDerivedExampleValue(ref reader, kind, options);
            }

            return result ?? throw new JsonException();
        }

        private const string ModelKind = "model";
        private const string ArrayKind = "array";
        private const string DictionaryKind = "dict";
        private const string UnionKind = "union";
        private const string UnknownKind = "unknown";

        private InputExampleValue CreateDerivedExampleValue(ref Utf8JsonReader reader, string? kind, JsonSerializerOptions options) => kind switch
        {
            null => throw new JsonException($"InputTypeExample must have a 'kind' property"),
            ArrayKind => CreateArrayExample(ref reader, options),
            DictionaryKind or ModelKind => CreateObjectExample(ref reader, options),
            UnionKind or UnknownKind => CreateUnknownExample(ref reader, options),
            _ => CreateOtherExample(ref reader, options),
        };

        private InputExampleValue CreateArrayExample(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            InputType? type = null;
            IReadOnlyList<InputExampleValue>? value = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType(TypePropertyName, options, ref type)
                    || reader.TryReadComplexType(ValuePropertyName, options, ref value);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var result = new InputExampleListValue(type ?? throw new JsonException(), value ?? throw new JsonException());

            return result;
        }

        private InputExampleValue CreateObjectExample(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            InputType? type = null;
            IReadOnlyDictionary<string, InputExampleValue>? value = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType(TypePropertyName, options, ref type)
                    || reader.TryReadComplexType(ValuePropertyName, options, ref value);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var result = new InputExampleObjectValue(type ?? throw new JsonException(), value ?? throw new JsonException());

            return result;
        }

        private InputExampleValue CreateUnknownExample(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            InputType? type = null;
            JsonElement? rawValue = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType(TypePropertyName, options, ref type)
                    || reader.TryReadComplexType(ValuePropertyName, options, ref rawValue);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var result = ParseUnknownValue(type ?? throw new JsonException(), rawValue);

            return result;

            static InputExampleValue ParseUnknownValue(InputType type, JsonElement? rawValue)
            {
                switch (rawValue?.ValueKind)
                {
                    case null or JsonValueKind.Null:
                        return InputExampleValue.Null(type);
                    case JsonValueKind.String:
                        return InputExampleValue.Value(type, rawValue.Value.GetString());
                    case JsonValueKind.True or JsonValueKind.False:
                        return InputExampleValue.Value(type, rawValue.Value.GetBoolean());
                    case JsonValueKind.Number:
                        var rawText = rawValue.Value.GetRawText();
                        if (int.TryParse(rawText, out var int32Value))
                            return InputExampleValue.Value(type, int32Value);
                        else if (long.TryParse(rawText, out var int64Value))
                            return InputExampleValue.Value(type, int64Value);
                        else if (float.TryParse(rawText, out var floatValue))
                            return InputExampleValue.Value(type, floatValue);
                        else if (double.TryParse(rawText, out var doubleValue))
                            return InputExampleValue.Value(type, doubleValue);
                        else if (decimal.TryParse(rawText, out var decimalValue))
                            return InputExampleValue.Value(type, decimalValue);
                        else
                            return InputExampleValue.Value(type, null);
                    case JsonValueKind.Array:
                        var length = rawValue.Value.GetArrayLength();
                        var values = new List<InputExampleValue>(length);
                        foreach (var item in rawValue.Value.EnumerateArray())
                        {
                            values.Add(ParseUnknownValue(type, item));
                        }
                        return InputExampleValue.List(type, values);
                    case JsonValueKind.Object:
                        var objValues = new Dictionary<string, InputExampleValue>();
                        foreach (var property in rawValue.Value.EnumerateObject())
                        {
                            objValues.Add(property.Name, ParseUnknownValue(type, property.Value));
                        }
                        return InputExampleValue.Object(type, objValues);
                    default:
                        throw new JsonException($"kind {rawValue?.ValueKind} is not expected here");
                }
            }
        }

        private InputExampleValue CreateOtherExample(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            InputType? type = null;
            JsonElement? rawValue = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType(TypePropertyName, options, ref type)
                    || reader.TryReadComplexType(ValuePropertyName, options, ref rawValue);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var effectiveType = type switch
            {
                null => throw new JsonException(),
                InputEnumType enumType => enumType.ValueType,
                InputDurationType durationType => durationType.WireType,
                InputDateTimeType dateTimeType => dateTimeType.WireType,
                _ => type
            };

            object? value = rawValue?.ValueKind switch
            {
                null or JsonValueKind.Null => null,
                JsonValueKind.String => rawValue.Value.GetString(),
                JsonValueKind.False => false,
                JsonValueKind.True => true,
                JsonValueKind.Number => effectiveType switch
                {
                    InputPrimitiveType { Kind: InputPrimitiveTypeKind.Int32 or InputPrimitiveTypeKind.UInt32 } => int.TryParse(rawValue.Value.GetRawText(), out var intValue) ? intValue : default(int),
                    InputPrimitiveType { Kind: InputPrimitiveTypeKind.Int64 or InputPrimitiveTypeKind.UInt64 or InputPrimitiveTypeKind.Integer } => long.TryParse(rawValue.Value.GetRawText(), out var longValue) ? longValue : default(long),
                    InputPrimitiveType { Kind: InputPrimitiveTypeKind.Float32 } => float.TryParse(rawValue.Value.GetRawText(), out var floatValue) ? floatValue : default(float),
                    InputPrimitiveType { Kind: InputPrimitiveTypeKind.Float64 or InputPrimitiveTypeKind.Float } => double.TryParse(rawValue.Value.GetRawText(), out var doubleValue) ? doubleValue : default(double),
                    InputPrimitiveType { Kind: InputPrimitiveTypeKind.Decimal or InputPrimitiveTypeKind.Decimal128 } => decimal.TryParse(rawValue.Value.GetRawText(), out var decimalValue) ? decimalValue : default(decimal),
                    _ => null,
                },
                _ => throw new JsonException($"kind {rawValue?.ValueKind} is not expected here")
            };

            var result = new InputExampleRawValue(type ?? throw new JsonException(), value);

            return result;
        }
    }
}
