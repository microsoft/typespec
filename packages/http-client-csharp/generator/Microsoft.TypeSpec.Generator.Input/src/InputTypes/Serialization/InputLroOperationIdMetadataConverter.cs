// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputLroOperationIdMetadataConverter : JsonConverter<InputLroOperationIdMetadata>
    {
        public override InputLroOperationIdMetadata Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? kind = null;
            string? path = null;
            InputOperationLink? source = null;
            InputPathParameter? pathParameter = null;
            InputModelProperty? property = null;
            IReadOnlyList<InputModelProperty>? propertySegments = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("kind", ref kind)
                    || reader.TryReadString("path", ref path)
                    || reader.TryReadComplexType("source", options, ref source)
                    || reader.TryReadComplexType("pathParameter", options, ref pathParameter)
                    || reader.TryReadComplexType("property", options, ref property)
                    || reader.TryReadComplexType("propertySegments", options, ref propertySegments);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return kind switch
            {
                "path" => new InputLroOperationIdPathMetadata(
                    source ?? throw new JsonException("LRO operation ID path must have a source."),
                    pathParameter ?? throw new JsonException("LRO operation ID path must have a path parameter."),
                    path ?? throw new JsonException("LRO operation ID path must have a polling path.")),
                "property" => new InputLroOperationIdPropertyMetadata(
                    property ?? throw new JsonException("LRO operation ID must have a property."),
                    propertySegments is { Count: > 0 } ? propertySegments : throw new JsonException("LRO operation ID must have property segments.")),
                _ => throw new JsonException($"Unknown LRO operation ID kind '{kind}'.")
            };
        }

        public override void Write(Utf8JsonWriter writer, InputLroOperationIdMetadata value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");
    }
}
