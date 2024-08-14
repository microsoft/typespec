// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputPrimitiveTypeConverter : JsonConverter<InputPrimitiveType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputPrimitiveTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputPrimitiveType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputPrimitiveType>(_referenceHandler.CurrentResolver) ?? CreatePrimitiveType(ref reader, null, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputPrimitiveType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputPrimitiveType CreatePrimitiveType(ref Utf8JsonReader reader, string? id, string? kind, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && kind == null && name == null;
            string? crossLanguageDefinitionId = null;
            string? encode = null;
            InputPrimitiveType? baseType = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputPrimitiveType.Kind), ref kind)
                    || reader.TryReadString(nameof(InputPrimitiveType.Name), ref name)
                    || reader.TryReadString(nameof(InputPrimitiveType.CrossLanguageDefinitionId), ref crossLanguageDefinitionId)
                    || reader.TryReadString(nameof(InputPrimitiveType.Encode), ref encode)
                    || reader.TryReadWithConverter(nameof(InputPrimitiveType.BaseType), options, ref baseType)
                    || reader.TryReadWithConverter(nameof(InputPrimitiveType.Decorators), options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            kind = kind ?? throw new JsonException("Primitive types must have kind");
            name = name ?? string.Empty;
            crossLanguageDefinitionId = crossLanguageDefinitionId ?? string.Empty;

            if (!Enum.TryParse<InputPrimitiveTypeKind>(kind, true, out var primitiveTypeKind))
            {
                throw new JsonException($"Unknown primitive type kind: {kind}");
            }

            var primitiveType = new InputPrimitiveType(primitiveTypeKind, name, crossLanguageDefinitionId, encode, baseType)
            {
                Decorators = decorators ?? []
            };
            if (id != null)
            {
                resolver.AddReference(id, primitiveType);
            }
            return primitiveType;
        }
    }
}
