// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputEnumTypeConverter : JsonConverter<InputEnumType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputEnumTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputEnumType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputEnumType>(_referenceHandler.CurrentResolver) ?? CreateEnumType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputEnumType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputEnumType CreateEnumType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && name == null;
            string? crossLanguageDefinitionId = null;
            string? accessibility = null;
            string? deprecated = null;
            string? description = null;
            InputModelTypeUsage usage = InputModelTypeUsage.None;
            string? usageString = null;
            bool isExtendable = false;
            InputType? valueType = null;
            IReadOnlyList<InputEnumTypeValue>? values = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputEnumType.Name), ref name)
                    || reader.TryReadString(nameof(InputEnumType.CrossLanguageDefinitionId), ref crossLanguageDefinitionId)
                    || reader.TryReadString(nameof(InputEnumType.Accessibility), ref accessibility)
                    || reader.TryReadString(nameof(InputEnumType.Deprecated), ref deprecated)
                    || reader.TryReadString(nameof(InputEnumType.Description), ref description)
                    || reader.TryReadString(nameof(InputEnumType.Usage), ref usageString)
                    || reader.TryReadBoolean(nameof(InputEnumType.IsExtensible), ref isExtendable)
                    || reader.TryReadWithConverter(nameof(InputEnumType.ValueType), options, ref valueType)
                    || reader.TryReadWithConverter(nameof(InputEnumType.Values), options, ref values)
                    || reader.TryReadWithConverter(nameof(InputEnumType.Decorators), options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("Enum must have name");
            if (description == null)
            {
                description = "";
                Console.Error.WriteLine($"[Warn]: Enum '{name}' must have a description");
            }

            if (usageString != null)
            {
                Enum.TryParse(usageString, ignoreCase: true, out usage);
            }

            if (values == null || values.Count == 0)
            {
                throw new JsonException("Enum must have at least one value");
            }

            if (valueType is not InputPrimitiveType inputValueType)
            {
                throw new JsonException("The ValueType of an EnumType must be a primitive type.");
            }

            var enumType = new InputEnumType(name, crossLanguageDefinitionId ?? string.Empty, accessibility, deprecated, description!, usage, inputValueType, NormalizeValues(values, inputValueType), isExtendable)
            {
                Decorators = decorators ?? []
            };
            if (id != null)
            {
                resolver.AddReference(id, enumType);
            }
            return enumType;
        }

        private static IReadOnlyList<InputEnumTypeValue> NormalizeValues(IReadOnlyList<InputEnumTypeValue> allowedValues, InputPrimitiveType valueType)
        {
            var concreteValues = new List<InputEnumTypeValue>(allowedValues.Count);

            switch (valueType.Kind)
            {
                case InputPrimitiveTypeKind.String:
                    foreach (var value in allowedValues)
                    {
                        if (value.Value is not string s)
                        {
                            throw new JsonException($"Enum value types are not consistent");
                        }
                        concreteValues.Add(new InputEnumTypeStringValue(value.Name, s, value.Description));
                    }
                    break;
                case InputPrimitiveTypeKind.Int32:
                    foreach (var value in allowedValues)
                    {
                        if (value.Value is not int i)
                        {
                            throw new JsonException($"Enum value types are not consistent");
                        }
                        concreteValues.Add(new InputEnumTypeIntegerValue(value.Name, i, value.Description));
                    }
                    break;
                case InputPrimitiveTypeKind.Float32:
                    foreach (var value in allowedValues)
                    {
                        switch (value.Value)
                        {
                            case int i:
                                concreteValues.Add(new InputEnumTypeFloatValue(value.Name, (float)i, value.Description));
                                break;
                            case float f:
                                concreteValues.Add(new InputEnumTypeFloatValue(value.Name, f, value.Description));
                                break;
                            default:
                                throw new JsonException($"Enum value types are not consistent");
                        }
                    }
                    break;
                default:
                    throw new JsonException($"Unsupported enum value type: {valueType.Kind}");
            }

            return concreteValues;
        }
    }
}
