// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal class TypeSpecInputDurationTypeConverter : JsonConverter<InputDurationType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public TypeSpecInputDurationTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputDurationType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
           => reader.ReadReferenceAndResolve<InputDurationType>(_referenceHandler.CurrentResolver) ?? CreateDurationType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputDurationType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputDurationType CreateDurationType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            string? crossLanguageDefinitionId = null;
            string? encode = null;
            InputPrimitiveType? wireType = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            InputDurationType? baseType = null;

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

            name = name ?? throw new JsonException("Duration type must have name");
            crossLanguageDefinitionId = crossLanguageDefinitionId ?? throw new JsonException("Duration type must have crossLanguageDefinitionId");
            encode = encode ?? throw new JsonException("Duration type must have encoding");
            wireType = wireType ?? throw new JsonException("Duration type must have wireType");

            var dateTimeType = Enum.TryParse<DurationKnownEncoding>(encode, ignoreCase: true, out var encodeKind)
                ? new InputDurationType(encodeKind, name, crossLanguageDefinitionId, wireType, baseType) { Decorators = decorators ?? [] }
                : throw new JsonException($"Encoding of Duration type {encode} is unknown.");

            if (id != null)
            {
                resolver.AddReference(id, dateTimeType);
            }
            return dateTimeType;
        }
    }
}
