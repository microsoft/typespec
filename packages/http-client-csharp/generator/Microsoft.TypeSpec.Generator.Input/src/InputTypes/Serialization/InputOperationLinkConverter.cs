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
                var isKnownProperty = reader.TryReadString("location", ref location)
                    || reader.TryReadComplexType("property", options, ref property);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputOperationLink(
                location is "ResponseHeader" or "ResponseBody" or "Self" ? location : throw new JsonException("LRO operation link must have a valid location."),
                property ?? throw new JsonException("LRO operation link must have a property."));
        }

        public override void Write(Utf8JsonWriter writer, InputOperationLink value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");
    }
}
