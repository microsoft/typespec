// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputOperationLinkConverter : JsonConverter<InputOperationLink>
    {
        public override InputOperationLink Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? location = null;
            InputModelProperty? property = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                if (!reader.TryReadString("location", ref location)
                    && !reader.TryReadComplexType("property", options, ref property))
                {
                    reader.SkipProperty();
                }
            }

            var parsedLocation = location switch
            {
                nameof(InputOperationLinkLocation.ResponseHeader) => InputOperationLinkLocation.ResponseHeader,
                nameof(InputOperationLinkLocation.ResponseBody) => InputOperationLinkLocation.ResponseBody,
                nameof(InputOperationLinkLocation.Self) => InputOperationLinkLocation.Self,
                null => throw new JsonException("Operation link must have a location."),
                _ => InputOperationLinkLocation.Unknown
            };

            return new InputOperationLink(parsedLocation,
                property ?? throw new JsonException("Operation link must have a property."));
        }

        public override void Write(Utf8JsonWriter writer, InputOperationLink value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");
    }
}
