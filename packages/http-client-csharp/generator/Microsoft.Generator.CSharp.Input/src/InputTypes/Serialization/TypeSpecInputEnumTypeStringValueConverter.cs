// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputEnumTypeStringValueConverter : JsonConverter<InputEnumTypeValue>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputEnumTypeStringValueConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputEnumTypeStringValue Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputEnumTypeStringValue>(_referenceHandler.CurrentResolver) ?? CreateEnumTypeValue(ref reader, null, null, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputEnumTypeValue value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputEnumTypeStringValue CreateEnumTypeValue(ref Utf8JsonReader reader, string? id, string? name, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            string? value = null;
            string? description = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputEnumTypeStringValue.Name), ref name)
                    || reader.TryReadEnumStringValue(nameof(InputEnumTypeStringValue.Value), ref value)
                    || reader.TryReadString(nameof(InputEnumTypeStringValue.Description), ref description);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("EnumValue must have name");

            value = value ?? throw new JsonException("EnumValue must have value");

            var enumValue = new InputEnumTypeStringValue(name, value!, description);
            if (id != null)
            {
                resolver.AddReference(id, enumValue);
            }
            return enumValue;
        }
    }
}
