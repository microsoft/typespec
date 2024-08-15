// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
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
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputNullableType.Name), ref name)
                    || reader.TryReadWithConverter(nameof(InputNullableType.Type), options, ref valueType)
                    || reader.TryReadWithConverter(nameof(InputNullableType.Decorators), options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            valueType = valueType ?? throw new JsonException("InputNullableType must have value type");

            var nullableType = new InputNullableType(valueType)
            {
                Decorators = decorators ?? [],
            };
            if (id != null)
            {
                resolver.AddReference(id, nullableType);
            }
            return nullableType;
        }
    }
}
