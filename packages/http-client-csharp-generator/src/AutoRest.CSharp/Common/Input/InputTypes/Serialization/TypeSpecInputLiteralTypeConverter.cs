// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Common.Input
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
            bool isNullable = false;
            object? value = null;
            InputType? type = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputLiteralType.Name), ref name)
                    || reader.TryReadBoolean(nameof(InputLiteralType.IsNullable), ref isNullable)
                    || reader.TryReadWithConverter(nameof(InputLiteralType.LiteralValueType), options, ref type);

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

            name = name ?? throw new JsonException($"{nameof(InputLiteralType)} must have a name.");

            type = type ?? throw new JsonException("InputConstant must have type");

            value = value ?? throw new JsonException("InputConstant must have value");

            var literalType = new InputLiteralType(name, type, value, isNullable);

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
                InputEnumType enumType => enumType.EnumValueType.Kind,
                _ => throw new JsonException($"Not supported literal type {type.GetType()}.")
            };
            object value = kind switch
            {
                InputTypeKind.String => reader.GetString() ?? throw new JsonException(),
                InputTypeKind.Int32 => reader.GetInt32(),
                InputTypeKind.Float32 => reader.GetSingle(),
                InputTypeKind.Float64 => reader.GetDouble(),
                InputTypeKind.Boolean => reader.GetBoolean(),
                _ => throw new JsonException($"Not supported literal type {kind}.")
            };
            reader.Read();
            return value;
        }
    }
}
