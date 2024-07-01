// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal class TypeSpecInputDateTimeTypeConverter : JsonConverter<InputDateTimeType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public TypeSpecInputDateTimeTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputDateTimeType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
           => reader.ReadReferenceAndResolve<InputDateTimeType>(_referenceHandler.CurrentResolver) ?? CreateDateTimeType(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputDateTimeType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputDateTimeType CreateDateTimeType(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            string? encode = null;
            InputType? type = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputDateTimeType.Encode), ref encode)
                    || reader.TryReadWithConverter(nameof(InputDateTimeType.WireType), options, ref type);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            if (type is not InputPrimitiveType wireType)
            {
                throw new JsonException("The wireType of a DateTime type must be a primitive type");
            }

            encode = encode ?? throw new JsonException("DateTime type must have encoding");

            var dateTimeType = Enum.TryParse<DateTimeKnownEncoding>(encode, ignoreCase: true, out var encodeKind)
                ? new InputDateTimeType(encodeKind, wireType)
                : throw new JsonException($"Encoding of DateTime type {encode} is unknown.");

            if (id != null)
            {
                resolver.AddReference(id, dateTimeType);
            }
            return dateTimeType;
        }
    }
}
