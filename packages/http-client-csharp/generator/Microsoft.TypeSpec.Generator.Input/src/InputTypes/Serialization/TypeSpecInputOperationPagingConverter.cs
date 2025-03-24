// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class TypeSpecInputOperationPagingConverter : JsonConverter<InputOperationPaging>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputOperationPagingConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputOperationPaging? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputOperationPaging>(_referenceHandler.CurrentResolver) ?? CreateInputOperationPaging(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputOperationPaging value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputOperationPaging CreateInputOperationPaging(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
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

            var result = new InputOperationPaging(itemPropertySegments ?? [], nextLink, continuationToken);
            if (id != null)
            {
                resolver.AddReference(id, result);
            }
            return result;
        }
    }
}
