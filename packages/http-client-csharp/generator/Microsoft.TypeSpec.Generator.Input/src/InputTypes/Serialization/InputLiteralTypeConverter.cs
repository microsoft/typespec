// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputLiteralTypeConverter : JsonConverter<InputLiteralType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public InputLiteralTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputLiteralType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
           => reader.ReadReferenceAndResolve<InputLiteralType>(_referenceHandler.CurrentResolver) ?? CreateInputLiteralType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputLiteralType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputLiteralType CreateInputLiteralType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? ns = null;
            JsonElement? rawValue = null;
            InputPrimitiveType? valueType = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadString("namespace", ref ns)
                    || reader.TryReadComplexType("value", options, ref rawValue)
                    || reader.TryReadComplexType("valueType", options, ref valueType)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? string.Empty;
            ns = ns ?? string.Empty;
            valueType = valueType ?? throw new JsonException("InputLiteralType must have type");

            if (rawValue == null)
            {
                throw new JsonException("InputLiteralType must have value");
            }

            var valueKind = valueType.Kind;
            object value = valueKind switch
            {
                InputPrimitiveTypeKind.String => rawValue.Value.GetString() ?? throw new JsonException(),
                InputPrimitiveTypeKind.Int32 => rawValue.Value.GetInt32(),
                InputPrimitiveTypeKind.Float32 => rawValue.Value.GetSingle(),
                InputPrimitiveTypeKind.Boolean => rawValue.Value.GetBoolean(),
                _ => throw new JsonException($"Not supported literal type {valueKind}.")
            };

            var literalType = new InputLiteralType(name, ns, valueType, value)
            {
                Decorators = decorators ?? []
            };

            if (id != null)
            {
                resolver.AddReference(id, literalType);
            }
            return literalType;
        }
    }
}
