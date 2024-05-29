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
            => reader.ReadReferenceAndResolve<InputEnumType>(_referenceHandler.CurrentResolver) ?? CreateEnumType(ref reader, null, null, options, _referenceHandler);

        public override void Write(Utf8JsonWriter writer, InputEnumType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputEnumType CreateEnumType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, TypeSpecReferenceHandler resolver)
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
            JsonSerializerOptions? allowedValueOptions = null;
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
                    || reader.TryReadWithConverter(nameof(InputEnumType.AllowedValues), allowedValueOptions!, ref allowedValues);

                if (allowedValueOptions is null && valueType is not null)
                {
                    allowedValueOptions = new JsonSerializerOptions(options);
                    switch (valueType.Kind)
                    {
                        case InputPrimitiveTypeKind.String:
                            allowedValueOptions.Converters.Add(new TypeSpecInputEnumTypeStringValueConverter(resolver));
                            break;
                        case InputPrimitiveTypeKind.Int32:
                            allowedValueOptions.Converters.Add(new TypeSpecInputEnumTypeIntValueConverter(resolver));
                            break;
                        case InputPrimitiveTypeKind.Float32:
                            allowedValueOptions.Converters.Add(new TypeSpecInputEnumTypeFloatValueConverter(resolver));
                            break;
                        default:
                            throw new JsonException($"Unsupported enum value type: {valueType.Kind}");
                    }
                }

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

            if (allowedValues == null || allowedValues.Count == 0)
            {
                throw new JsonException("Enum must have at least one value");
            }

            valueType = valueType ?? throw new JsonException("Enum value type must be set.");

            var enumType = new InputEnumType(name, ns, accessibility, deprecated, description, usage, valueType, allowedValues, isExtendable, isNullable);
            if (id != null)
            {
                resolver.CurrentResolver.AddReference(id, enumType);
            }
            return enumType;
        }
    }
}
