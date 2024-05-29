// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputEnumTypeIntValueConverter : JsonConverter<InputEnumTypeValue>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputEnumTypeIntValueConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputEnumTypeIntegerValue Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputEnumTypeIntegerValue>(_referenceHandler.CurrentResolver) ?? CreateEnumTypeValue(ref reader, null, null, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputEnumTypeValue value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputEnumTypeIntegerValue CreateEnumTypeValue(ref Utf8JsonReader reader, string? id, string? name, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            int? value = null;
            string? description = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputEnumTypeIntegerValue.Name), ref name)
                    || reader.TryReadEnumIntValue(nameof(InputEnumTypeIntegerValue.Value), ref value)
                    || reader.TryReadString(nameof(InputEnumTypeIntegerValue.Description), ref description);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("EnumValue must have name");

            value = value ?? throw new JsonException("EnumValue must have value");

            var enumValue = new InputEnumTypeIntegerValue(name, value.Value, description);
            if (id != null)
            {
                resolver.AddReference(id, enumValue);
            }
            return enumValue;
        }
    }
}
