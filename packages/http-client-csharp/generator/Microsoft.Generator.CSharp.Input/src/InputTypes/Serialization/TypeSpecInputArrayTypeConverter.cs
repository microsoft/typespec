// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputArrayTypeConverter : JsonConverter<InputArrayType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputArrayTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputArrayType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputArrayType>(_referenceHandler.CurrentResolver) ?? CreateListType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputArrayType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputArrayType CreateListType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            string? crossLanguageDefinitionId = null;
            InputType? valueType = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputArrayType.Name), ref name)
                    || reader.TryReadString(nameof(InputArrayType.CrossLanguageDefinitionId), ref crossLanguageDefinitionId)
                    || reader.TryReadWithConverter(nameof(InputArrayType.ValueType), options, ref valueType);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            valueType = valueType ?? throw new JsonException("List must have element type");
            var listType = new InputArrayType(name ?? "Array", crossLanguageDefinitionId ?? string.Empty, valueType);
            if (id != null)
            {
                resolver.AddReference(id, listType);
            }
            return listType;
        }
    }
}
