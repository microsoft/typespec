// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal class TypeSpecInputConstantConverter : JsonConverter<InputConstant>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputConstantConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputConstant Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputConstant>(_referenceHandler.CurrentResolver) ?? CreateInputConstant(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputConstant value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputConstant CreateInputConstant(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            InputType? type = null;

            reader.TryReadReferenceId(ref isFirstProperty, ref id);
            if (!reader.TryReadWithConverter(nameof(InputConstant.Type), options, ref type))
            {
                throw new JsonException("Must provide type ahead of value.");
            }
            var value = ReadConstantValue(ref reader, nameof(InputConstant.Value), type);

            type = type ?? throw new JsonException("InputConstant must have type");

            value = value ?? throw new JsonException("InputConstant must have value");

            var constant = new InputConstant(value, type);
            if (id != null)
            {
                resolver.AddReference(id, constant);
            }
            return constant;
        }

        public static object ReadConstantValue(ref Utf8JsonReader reader, string propertyName, InputType? type)
        {
            if (type == null)
            {
                throw new JsonException("Must place type ahead of value.");
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
            object? value;
            switch (type) {
                case InputPrimitiveType primitiveType:
                    switch (primitiveType.Kind)
                    {
                        case InputPrimitiveTypeKind.String:
                            value = reader.GetString() ?? throw new JsonException();
                            break;
                        case InputPrimitiveTypeKind.Url:
                            var stringvalue = reader.GetString() ?? throw new JsonException();
                            value = new Uri(stringvalue);
                            break;
                        case InputPrimitiveTypeKind.Int32:
                            value = reader.GetInt32();
                            break;
                        case InputPrimitiveTypeKind.Int64:
                            value = reader.GetInt64();
                            break;
                        case InputPrimitiveTypeKind.Boolean:
                            value = reader.GetBoolean();
                            break;
                        default:
                            value = reader.GetString() ?? throw new JsonException();
                            break;
                    }
                    break;
                case InputEnumType enumType:
                    switch (enumType.ValueType.Kind)
                    {
                        case InputPrimitiveTypeKind.String:
                            value = reader.GetString() ?? throw new JsonException();
                            break;
                        case InputPrimitiveTypeKind.Int32:
                            value = reader.GetInt32();
                            break;
                        case InputPrimitiveTypeKind.Float32:
                            value = reader.GetDouble();
                            break;
                        default:
                            throw new JsonException($"Unsupported enum value type: {enumType.ValueType.Kind}");
                    }
                    break;
                case InputLiteralType literalType:
                    value = literalType.Value;
                    break;
                default:
                    throw new JsonException($"Not supported type: {type.GetType()}");
            }
            reader.Read();
            return value;
        }
    }
}
