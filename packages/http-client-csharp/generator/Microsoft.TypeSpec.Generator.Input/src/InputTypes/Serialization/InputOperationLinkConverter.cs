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

            if (location is null)
            {
                throw new JsonException("Operation link must have a location.");
            }
            var parsedLocation = Enum.TryParse<InputOperationLinkLocation>(location, ignoreCase: true, out var value) && Enum.IsDefined(value)
                ? value
                : InputOperationLinkLocation.Unknown;

            return new InputOperationLink(parsedLocation,
                property ?? throw new JsonException("Operation link must have a property."));
        }

        public override void Write(Utf8JsonWriter writer, InputOperationLink value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");
    }
}
