// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputTypeConverter : JsonConverter<InputType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputType>(_referenceHandler.CurrentResolver) ?? CreateInputType(ref reader, options);
        }

        public override void Write(Utf8JsonWriter writer, InputType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputType CreateInputType(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            string? id = null;
            string? kind = null;
            string? name = null;
            InputType? result = null;
            var isFirstProperty = true;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrNameOrKind = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString("kind", ref kind)
                    || reader.TryReadString("name", ref name);

                if (isIdOrNameOrKind)
                {
                    continue;
                }
                result = CreateDerivedType(ref reader, id, kind, name, options);
            }

            return result ?? CreateDerivedType(ref reader, id, kind, name, options);
        }

        private const string LiteralKind = "constant";
        private const string UnionKind = "union";
        private const string ModelKind = "model";
        private const string EnumKind = "enum";
        private const string ArrayKind = "array";
        private const string DictionaryKind = "dict";
        private const string NullableKind = "nullable";
        private const string UtcDateTimeKind = "utcDateTime";
        private const string OffsetDateTimeKind = "offsetDateTime";
        private const string DurationKind = "duration";

        private InputType CreateDerivedType(ref Utf8JsonReader reader, string? id, string? kind, string? name, JsonSerializerOptions options) => kind switch
        {
            null => throw new JsonException($"InputType (id: '{id}', name: '{name}') must have a 'Kind' property"),
            LiteralKind => TypeSpecInputLiteralTypeConverter.CreateInputLiteralType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            UnionKind => TypeSpecInputUnionTypeConverter.CreateInputUnionType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            ModelKind => TypeSpecInputModelTypeConverter.CreateModelType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            EnumKind => TypeSpecInputEnumTypeConverter.CreateEnumType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            ArrayKind => TypeSpecInputArrayTypeConverter.CreateListType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            DictionaryKind => TypeSpecInputDictionaryTypeConverter.CreateDictionaryType(ref reader, id, options, _referenceHandler.CurrentResolver),
            UtcDateTimeKind or OffsetDateTimeKind => TypeSpecInputDateTimeTypeConverter.CreateDateTimeType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            DurationKind => TypeSpecInputDurationTypeConverter.CreateDurationType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            NullableKind => TypeSpecInputNullableTypeConverter.CreateNullableType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            _ => TypeSpecInputPrimitiveTypeConverter.CreatePrimitiveType(ref reader, id, kind, name, options, _referenceHandler.CurrentResolver),
        };
    }
}
