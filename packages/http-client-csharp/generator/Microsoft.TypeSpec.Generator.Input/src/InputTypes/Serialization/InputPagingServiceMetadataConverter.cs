// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputPagingServiceMetadataConverter : JsonConverter<InputPagingServiceMetadata>
    {
        public InputPagingServiceMetadataConverter()
        {
        }

        public override InputPagingServiceMetadata? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateInputPagingServiceMetadata(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputPagingServiceMetadata value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputPagingServiceMetadata CreateInputPagingServiceMetadata(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            IReadOnlyList<string>? itemPropertySegments = null;
            InputNextLink? nextLink = null;
            InputContinuationToken? continuationToken = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("itemPropertySegments", options, ref itemPropertySegments)
                    || reader.TryReadComplexType("nextLink", options, ref nextLink)
                    || reader.TryReadComplexType("continuationToken", options, ref continuationToken);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputPagingServiceMetadata(itemPropertySegments ?? [], nextLink, continuationToken);
        }
    }
}
