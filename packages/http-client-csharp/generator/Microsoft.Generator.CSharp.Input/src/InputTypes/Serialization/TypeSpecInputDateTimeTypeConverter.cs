// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal class TypeSpecInputDateTimeTypeConverter : JsonConverter<InputDateTimeType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public TypeSpecInputDateTimeTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputDateTimeType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
           => reader.ReadReferenceAndResolve<InputDateTimeType>(_referenceHandler.CurrentResolver) ?? CreateDateTimeType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputDateTimeType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputDateTimeType CreateDateTimeType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            string? crossLanguageDefinitionId = null;
            string? encode = null;
            InputType? type = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            InputDateTimeType? baseType = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputDateTimeType.Name), ref name)
                    || reader.TryReadString(nameof(InputDateTimeType.CrossLanguageDefinitionId), ref crossLanguageDefinitionId)
                    || reader.TryReadString(nameof(InputDateTimeType.Encode), ref encode)
                    || reader.TryReadWithConverter(nameof(InputDateTimeType.WireType), options, ref type)
                    || reader.TryReadWithConverter(nameof(InputDateTimeType.BaseType), options, ref baseType)
                    || reader.TryReadWithConverter(nameof(InputDateTimeType.Decorators), options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            if (type is not InputPrimitiveType wireType)
            {
                throw new JsonException("The wireType of a DateTime type must be a primitive type");
            }

            name = name ?? throw new JsonException("DateTime type must have name");
            crossLanguageDefinitionId = crossLanguageDefinitionId ?? throw new JsonException("DateTime type must have crossLanguageDefinitionId");
            encode = encode ?? throw new JsonException("DateTime type must have encoding");

            var dateTimeType = Enum.TryParse<DateTimeKnownEncoding>(encode, ignoreCase: true, out var encodeKind)
                ? new InputDateTimeType(encodeKind, name, crossLanguageDefinitionId, wireType, baseType) { Decorators = decorators ?? [] }
                : throw new JsonException($"Encoding of DateTime type {encode} is unknown.");

            if (id != null)
            {
                resolver.AddReference(id, dateTimeType);
            }
            return dateTimeType;
        }
    }
}
