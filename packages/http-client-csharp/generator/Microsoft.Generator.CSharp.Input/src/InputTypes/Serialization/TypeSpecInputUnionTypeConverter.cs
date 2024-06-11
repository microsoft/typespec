// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal class TypeSpecInputUnionTypeConverter : JsonConverter<InputUnionType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public TypeSpecInputUnionTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputUnionType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputUnionType>(_referenceHandler.CurrentResolver) ?? CreateInputUnionType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputUnionType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputUnionType CreateInputUnionType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty model to resolve circular references
            var union = new InputUnionType(null!, null!, false);
            resolver.AddReference(id, union);

            bool isNullable = false;
            IReadOnlyList<InputType>? variantTypes = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString(nameof(InputUnionType.Name), ref name)
                    || reader.TryReadWithConverter(nameof(InputUnionType.VariantTypes), options, ref variantTypes)
                    || reader.TryReadBoolean(nameof(InputUnionType.IsNullable), ref isNullable);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            union.Name = name ?? throw new JsonException($"{nameof(InputLiteralType)} must have a name.");
            if (variantTypes == null || variantTypes.Count == 0)
            {
                throw new JsonException("Union must have a least one union type");
            }
            union.VariantTypes = variantTypes;
            union.IsNullable = isNullable;
            return union;
        }
    }
}
