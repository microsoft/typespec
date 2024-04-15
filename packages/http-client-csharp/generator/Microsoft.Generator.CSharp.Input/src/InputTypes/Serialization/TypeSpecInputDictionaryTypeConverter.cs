// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputDictionaryTypeConverter : JsonConverter<InputDictionary>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputDictionaryTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputDictionary? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputDictionary>(_referenceHandler.CurrentResolver) ?? CreateDictionaryType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputDictionary value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputDictionary CreateDictionaryType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && name == null;
            bool isNullable = false;
            InputType? keyType = null;
            InputType? valueType = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputDictionary.Name), ref name)
                    || reader.TryReadBoolean(nameof(InputDictionary.IsNullable), ref isNullable)
                    || reader.TryReadWithConverter(nameof(InputDictionary.KeyType), options, ref keyType)
                    || reader.TryReadWithConverter(nameof(InputDictionary.ValueType), options, ref valueType);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("Dictionary must have name");
            keyType = keyType ?? throw new JsonException("Dictionary must have key type");
            valueType = valueType ?? throw new JsonException("Dictionary must have value type");

            var dictType = new InputDictionary(name, keyType, valueType, isNullable);
            if (id != null)
            {
                resolver.AddReference(id, dictType);
            }
            return dictType;
        }
    }
}
