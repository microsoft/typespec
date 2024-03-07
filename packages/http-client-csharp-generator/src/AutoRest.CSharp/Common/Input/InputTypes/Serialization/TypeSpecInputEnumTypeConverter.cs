// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AutoRest.CSharp.Common.Input
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
            bool isNullable = false;
            string? ns = null;
            string? accessibility = null;
            string? deprecated = null;
            string? description = null;
            InputModelTypeUsage usage = InputModelTypeUsage.None;
            string? usageString = null;
            bool isExtendable = false;
            InputPrimitiveType? valueType = null;
            IReadOnlyList<InputEnumTypeValue>? allowedValues = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputEnumType.Name), ref name)
                    || reader.TryReadBoolean(nameof(InputEnumType.IsNullable), ref isNullable)
                    || reader.TryReadString(nameof(InputEnumType.Namespace), ref ns)
                    || reader.TryReadString(nameof(InputEnumType.Accessibility), ref accessibility)
                    || reader.TryReadString(nameof(InputEnumType.Deprecated), ref deprecated)
                    || reader.TryReadString(nameof(InputEnumType.Description), ref description)
                    || reader.TryReadString(nameof(InputEnumType.Usage), ref usageString)
                    || reader.TryReadBoolean(nameof(InputEnumType.IsExtensible), ref isExtendable)
                    || reader.TryReadPrimitiveType(nameof(InputEnumType.EnumValueType), ref valueType)
                    || reader.TryReadWithConverter(nameof(InputEnumType.AllowedValues), options, ref allowedValues);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("Enum must have name");
            // TODO: roll back to throw JSON error when there is linter on the upstream to check enum without @doc
            //description = description ?? throw new JsonException("Enum must have a description");
            if (description == null)
            {
                description = "";
                Console.Error.WriteLine($"[Warn]: Enum '{name}' must have a description");
            }

            if (usageString != null)
            {
                Enum.TryParse(usageString, ignoreCase: true, out usage);
            }

            if (allowedValues == null || allowedValues.Count == 0)
            {
                throw new JsonException("Enum must have at least one value");
            }

            InputPrimitiveType? currentType = null;
            foreach (var value in allowedValues)
            {
                switch (value.Value)
                {
                    case int i:
                        if (currentType == InputPrimitiveType.String)
                            throw new JsonException($"Enum value types are not consistent.");
                        if (currentType != InputPrimitiveType.Float32)
                            currentType = InputPrimitiveType.Int32;
                        break;
                    case float f:
                        if (currentType == InputPrimitiveType.String)
                            throw new JsonException($"Enum value types are not consistent.");
                        currentType = InputPrimitiveType.Float32;
                        break;
                    case string:
                        if (currentType == InputPrimitiveType.Int32 || currentType == InputPrimitiveType.Float32)
                            throw new JsonException($"Enum value types are not consistent.");
                        currentType = InputPrimitiveType.String;
                        break;
                    default:
                        throw new JsonException($"Unsupported enum value type, expect string, int or float.");
                }
            }
            valueType = currentType ?? throw new JsonException("Enum value type must be set.");

            var enumType = new InputEnumType(name, ns, accessibility, deprecated, description, usage, valueType, NormalizeValues(allowedValues, valueType), isExtendable, isNullable);
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
                case InputTypeKind.String:
                    foreach (var value in allowedValues)
                    {
                        concreteValues.Add(new InputEnumTypeStringValue(value.Name, (string)value.Value, value.Description));
                    }
                    break;
                case InputTypeKind.Int32:
                    foreach (var value in allowedValues)
                    {
                        concreteValues.Add(new InputEnumTypeIntegerValue(value.Name, (int)value.Value, value.Description));
                    }
                    break;
                case InputTypeKind.Float32:
                    foreach (var value in allowedValues)
                    {
                        switch (value.Value)
                        {
                            case int i:
                                concreteValues.Add(new InputEnumTypeFloatValue(value.Name, i, value.Description));
                                break;
                            case float f:
                                concreteValues.Add(new InputEnumTypeFloatValue(value.Name, f, value.Description));
                                break;
                            default:
                                throw new JsonException($"Enum value type of ${value.Name} cannot cast to float.");
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
