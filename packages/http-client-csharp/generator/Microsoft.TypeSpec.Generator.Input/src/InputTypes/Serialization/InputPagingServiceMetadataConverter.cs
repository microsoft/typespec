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
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputPagingServiceMetadataConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputPagingServiceMetadata? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputPagingServiceMetadata>(_referenceHandler.CurrentResolver) ?? CreateInputPagingServiceMetadata(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputPagingServiceMetadata value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputPagingServiceMetadata CreateInputPagingServiceMetadata(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            IReadOnlyList<string>? itemPropertySegments = null;
            InputNextLink? nextLink = null;
            InputContinuationToken? continuationToken = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadComplexType("itemPropertySegments", options, ref itemPropertySegments)
                    || reader.TryReadComplexType("nextLink", options, ref nextLink)
                    || reader.TryReadComplexType("continuationToken", options, ref continuationToken);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var result = new InputPagingServiceMetadata(itemPropertySegments ?? [], nextLink, continuationToken);
            if (id != null)
            {
                resolver.AddReference(id, result);
            }
            return result;
        }
    }
}
