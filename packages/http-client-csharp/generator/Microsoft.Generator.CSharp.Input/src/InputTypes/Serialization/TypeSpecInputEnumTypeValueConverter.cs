// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputEnumTypeValueConverter : JsonConverter<InputEnumTypeValue>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputEnumTypeValueConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputEnumTypeValue Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputEnumTypeValue>(_referenceHandler.CurrentResolver) ?? CreateEnumTypeValue(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputEnumTypeValue value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputEnumTypeValue CreateEnumTypeValue(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            JsonElement? rawValue = null;
            InputPrimitiveType? valueType = null;
            string? description = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadWithConverter("value", options, ref rawValue)
                    || reader.TryReadWithConverter("valueType", options, ref valueType)
                    || reader.TryReadString("description", ref description)
                    || reader.TryReadWithConverter("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("EnumValue must have name");

            rawValue = rawValue ?? throw new JsonException("EnumValue must have value");

            valueType = valueType ?? throw new JsonException("EnumValue must have valueType");

            InputEnumTypeValue enumValue = valueType.Kind switch
            {
                InputPrimitiveTypeKind.String => new InputEnumTypeStringValue(name, rawValue.Value.GetString() ?? throw new JsonException(), valueType, description) { Decorators = decorators ?? [] },
                InputPrimitiveTypeKind.Int32 => new InputEnumTypeIntegerValue(name, rawValue.Value.GetInt32(), valueType, description) { Decorators = decorators ?? [] },
                InputPrimitiveTypeKind.Float32 => new InputEnumTypeFloatValue(name, rawValue.Value.GetSingle(), valueType, description) { Decorators = decorators ?? [] },
                _ => throw new JsonException()
            };
            if (id != null)
            {
                resolver.AddReference(id, enumValue);
            }
            return enumValue;
        }
    }
}
