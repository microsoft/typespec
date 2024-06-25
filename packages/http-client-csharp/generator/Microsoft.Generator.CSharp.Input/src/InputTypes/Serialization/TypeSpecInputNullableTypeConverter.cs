// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Generator.CSharp.Input;

namespace AutoRest.CSharp.Common.Input.InputTypes.Serialization
{
    internal class TypeSpecInputNullableTypeConverter : JsonConverter<InputNullableType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public TypeSpecInputNullableTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputNullableType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputNullableType>(_referenceHandler.CurrentResolver) ?? CreateNullableType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputNullableType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputNullableType CreateNullableType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && name == null;
            InputType? valueType = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputNullableType.Name), ref name)
                    || reader.TryReadWithConverter(nameof(InputNullableType.Type), options, ref valueType);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            valueType = valueType ?? throw new JsonException("InputNullableType must have value type");

            var nullableType = new InputNullableType(valueType);
            if (id != null)
            {
                resolver.AddReference(id, nullableType);
            }
            return nullableType;
        }
    }
}
