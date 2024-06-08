// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputTypeConverter : JsonConverter<InputType>
    {
        private const string KindPropertyName = "Kind";

        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputType>(_referenceHandler.CurrentResolver) ?? CreateObject(ref reader, options);
        }

        public override void Write(Utf8JsonWriter writer, InputType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputType CreateObject(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            string? id = null;
            string? kind = null;
            string? name = null;
            InputType? result = null;
            var isFirstProperty = true;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrNameOrKind = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(KindPropertyName, ref kind)
                    || reader.TryReadString(nameof(InputType.Name), ref name);

                if (isIdOrNameOrKind)
                {
                    continue;
                }
                result = CreateDerivedType(ref reader, id, kind, name, options);
            }

            return result ?? throw new JsonException("cannot deserialize InputType");
        }

        private const string LiteralKind = "constant";
        private const string UnionKind = "union";
        private const string ModelKind = "Model";
        private const string EnumKind = "enum";
        private const string ArrayKind = "Array";
        private const string DictionaryKind = "Dictionary";
        private const string UtcDateTimeKind = "utcDateTime";
        private const string OffsetDateTimeKind = "offsetDateTime";
        private const string DurationKind = "duration";

        private InputType CreateDerivedType(ref Utf8JsonReader reader, string? id, string? kind, string? name, JsonSerializerOptions options) => kind switch
        {
            null => throw new JsonException("InputType must have a 'Kind' property"),
            LiteralKind => TypeSpecInputLiteralTypeConverter.CreateInputLiteralType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            UnionKind => TypeSpecInputUnionTypeConverter.CreateInputUnionType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            ModelKind => TypeSpecInputModelTypeConverter.CreateModelType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            EnumKind => TypeSpecInputEnumTypeConverter.CreateEnumType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            ArrayKind => TypeSpecInputListTypeConverter.CreateListType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            DictionaryKind => TypeSpecInputDictionaryTypeConverter.CreateDictionaryType(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            UtcDateTimeKind or OffsetDateTimeKind => TypeSpecInputDateTimeTypeConverter.CreateDateTimeType(ref reader, id, options, _referenceHandler.CurrentResolver),
            DurationKind => TypeSpecInputDurationTypeConverter.CreateDurationType(ref reader, id, options, _referenceHandler.CurrentResolver),
            _ => ReadPrimitiveType(ref reader, id, kind, _referenceHandler.CurrentResolver),
        };

        private static InputPrimitiveType ReadPrimitiveType(ref Utf8JsonReader reader, string? id, string? kind, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            var isNullable = false;
            string? encode = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadBoolean(nameof(InputPrimitiveType.IsNullable), ref isNullable)
                    || reader.TryReadString(nameof(InputPrimitiveType.Kind), ref kind)
                    || reader.TryReadString(nameof(InputPrimitiveType.Encode), ref encode);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var primitiveType = CreatePrimitiveType(kind, encode, isNullable);
            if (id != null)
            {
                resolver.AddReference(id, primitiveType);
            }

            return primitiveType;
        }

        public static InputPrimitiveType CreatePrimitiveType(string? primitiveKind, string? encode, bool isNullable)
        {
            ArgumentNullException.ThrowIfNull(primitiveKind, nameof(primitiveKind));

            return Enum.TryParse<InputPrimitiveTypeKind>(primitiveKind, ignoreCase: true, out var kind)
                ? new InputPrimitiveType(kind, encode, isNullable)
                : throw new JsonException($"{primitiveKind} type is unknown.");
        }
    }
}
