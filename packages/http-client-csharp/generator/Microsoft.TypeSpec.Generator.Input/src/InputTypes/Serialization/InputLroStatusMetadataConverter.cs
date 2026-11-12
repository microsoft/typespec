// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputLroStatusMetadataConverter : JsonConverter<InputLroStatusMetadata>
    {
        public override InputLroStatusMetadata Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            InputModelProperty? property = null;
            IReadOnlyList<InputModelProperty>? propertySegments = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("property", options, ref property)
                    || reader.TryReadComplexType("propertySegments", options, ref propertySegments);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputLroStatusMetadata(
                property ?? throw new JsonException("LRO status metadata must have a property."),
                propertySegments is { Count: > 0 } ? propertySegments : throw new JsonException("LRO status metadata must have property segments."));
        }

        public override void Write(Utf8JsonWriter writer, InputLroStatusMetadata value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");
    }
}
