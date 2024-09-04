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
            InputPrimitiveType? wireType = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            InputDateTimeType? baseType = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadString("encode", ref encode)
                    || reader.TryReadWithConverter("wireType", options, ref wireType)
                    || reader.TryReadWithConverter("baseType", options, ref baseType)
                    || reader.TryReadWithConverter("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("DateTime type must have name");
            crossLanguageDefinitionId = crossLanguageDefinitionId ?? throw new JsonException("DateTime type must have crossLanguageDefinitionId");
            encode = encode ?? throw new JsonException("DateTime type must have encoding");
            wireType = wireType ?? throw new JsonException("DateTime type must have wireType");

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
