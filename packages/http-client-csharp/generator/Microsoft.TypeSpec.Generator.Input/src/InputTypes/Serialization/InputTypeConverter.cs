// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputTypeConverter : JsonConverter<InputType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputType>(_referenceHandler.CurrentResolver) ?? CreateInputType(ref reader, options, _referenceHandler.CurrentResolver);
        }

        public override void Write(Utf8JsonWriter writer, InputType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputType CreateInputType(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            string? kind = null;
            string? name = null;
            InputType? result = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrNameOrKind = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("kind", ref kind)
                    || reader.TryReadString("name", ref name);

                if (isIdOrNameOrKind)
                {
                    continue;
                }
                result = CreateDerivedType(ref reader, id, kind, name, options, resolver);
            }

            return result ?? CreateDerivedType(ref reader, id, kind, name, options, resolver);
        }

        private const string LiteralKind = "constant";
        private const string UnionKind = "union";
        private const string ModelKind = "model";
        private const string EnumKind = "enum";
        private const string EnumValueKind = "enumvalue";
        private const string ArrayKind = "array";
        private const string DictionaryKind = "dict";
        private const string NullableKind = "nullable";
        private const string UtcDateTimeKind = "utcDateTime";
        private const string OffsetDateTimeKind = "offsetDateTime";
        private const string DurationKind = "duration";

        private static InputType CreateDerivedType(ref Utf8JsonReader reader, string? id, string? kind, string? name, JsonSerializerOptions options, ReferenceResolver resolver) => kind switch
        {
            null => throw new JsonException($"InputType (id: '{id}', name: '{name}') must have a 'Kind' property"),
            LiteralKind => InputLiteralTypeConverter.CreateInputLiteralType(ref reader, id, name, options, resolver),
            UnionKind => InputUnionTypeConverter.CreateInputUnionType(ref reader, id, name, options, resolver),
            ModelKind => InputModelTypeConverter.CreateModelType(ref reader, id, name, options, resolver),
            EnumKind => InputEnumTypeConverter.CreateEnumType(ref reader, id, name, options, resolver),
            EnumValueKind => InputEnumTypeValueConverter.CreateEnumTypeValue(ref reader, id, name, options, resolver),
            ArrayKind => InputArrayTypeConverter.CreateListType(ref reader, id, name, options, resolver),
            DictionaryKind => InputDictionaryTypeConverter.CreateDictionaryType(ref reader, id, options, resolver),
            UtcDateTimeKind or OffsetDateTimeKind => InputDateTimeTypeConverter.CreateDateTimeType(ref reader, id, name, options, resolver),
            DurationKind => InputDurationTypeConverter.CreateDurationType(ref reader, id, name, options, resolver),
            NullableKind => TypeSpecInputNullableTypeConverter.CreateNullableType(ref reader, id, name, options, resolver),
            _ => InputPrimitiveTypeConverter.CreatePrimitiveType(ref reader, id, kind, name, options, resolver),
        };
    }
}
