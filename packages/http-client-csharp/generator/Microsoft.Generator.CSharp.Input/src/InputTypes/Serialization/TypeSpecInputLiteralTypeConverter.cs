// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal class TypeSpecInputLiteralTypeConverter : JsonConverter<InputLiteralType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public TypeSpecInputLiteralTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputLiteralType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
           => reader.ReadReferenceAndResolve<InputLiteralType>(_referenceHandler.CurrentResolver) ?? CreateInputLiteralType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputLiteralType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputLiteralType CreateInputLiteralType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && name == null;
            object? value = null;
            InputType? type = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadWithConverter(nameof(InputLiteralType.ValueType), options, ref type)
                    || reader.TryReadWithConverter(nameof(InputLiteralType.Decorators), options, ref decorators);

                if (isKnownProperty)
                {
                    continue;
                }

                if (reader.GetString() == nameof(InputLiteralType.Value))
                {
                    value = ReadLiteralValue(ref reader, nameof(InputLiteralType.Value), options, type);
                }
                else
                {
                    reader.SkipProperty();
                }
            }

            type = type ?? throw new JsonException("InputConstant must have type");

            value = value ?? throw new JsonException("InputConstant must have value");

            var literalType = new InputLiteralType(type, value)
            {
                Decorators = decorators ?? []
            };

            if (id != null)
            {
                resolver.AddReference(id, literalType);
            }
            return literalType;
        }

        public static object ReadLiteralValue(ref Utf8JsonReader reader, string propertyName, JsonSerializerOptions options, InputType? type)
        {
            if (type == null)
            {
                throw new JsonException("Must place ValueType ahead of value.");
            }
            if (reader.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            if (reader.GetString() != propertyName)
            {
                throw new JsonException("This is not for json field " + propertyName);
            }

            reader.Read();
            // get the kind of the primitive type or the underlying type of the enum
            var kind = type switch
            {
                InputPrimitiveType primitiveType => primitiveType.Kind,
                InputEnumType enumType => enumType.ValueType.Kind,
                _ => throw new JsonException($"Not supported literal type {type.GetType()}.")
            };
            object value = kind switch
            {
                InputPrimitiveTypeKind.String => reader.GetString() ?? throw new JsonException(),
                InputPrimitiveTypeKind.Int32 => reader.GetInt32(),
                InputPrimitiveTypeKind.Float32 => reader.GetSingle(),
                InputPrimitiveTypeKind.Float64 => reader.GetDouble(),
                InputPrimitiveTypeKind.Boolean => reader.GetBoolean(),
                _ => throw new JsonException($"Not supported literal type {kind}.")
            };
            reader.Read();
            return value;
        }
    }
}
