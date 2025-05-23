// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputDictionaryTypeConverter : JsonConverter<InputDictionaryType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputDictionaryTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputDictionaryType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputDictionaryType>(_referenceHandler.CurrentResolver) ?? CreateDictionaryType(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputDictionaryType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputDictionaryType CreateDictionaryType(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            InputType? keyType = null;
            InputType? valueType = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadComplexType("keyType", options, ref keyType)
                    || reader.TryReadComplexType("valueType", options, ref valueType)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            keyType = keyType ?? throw new JsonException("Dictionary must have key type");
            valueType = valueType ?? throw new JsonException("Dictionary must have value type");

            var dictType = new InputDictionaryType("Dictionary", keyType, valueType)
            {
                Decorators = decorators ?? [],
            };
            if (id != null)
            {
                resolver.AddReference(id, dictType);
            }
            return dictType;
        }
    }
}
