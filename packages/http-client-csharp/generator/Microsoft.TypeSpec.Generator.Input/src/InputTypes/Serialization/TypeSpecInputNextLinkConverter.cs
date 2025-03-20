// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputNextLinkConverter : JsonConverter<InputNextLink>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputNextLinkConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputNextLink? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputNextLink>(_referenceHandler.CurrentResolver) ?? CreateNextLink(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputNextLink value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputNextLink CreateNextLink(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            reader.TryReadReferenceId(ref id);

            id = id ?? throw new JsonException();

            InputOperation? operation = null;
            IReadOnlyList<string>? responseSegments = null;
            InputResponseLocation? responseLocation = null;

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("operation", options, ref operation)
                    || reader.TryReadComplexType("responseSegments", options, ref responseSegments)
                    || reader.TryReadComplexType("responseLocation", options, ref responseLocation);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var nextLink = new InputNextLink(
                operation,
                responseSegments ?? throw new JsonException("NextLink response segments must be defined."),
                responseLocation ?? throw new JsonException("NextLink response location must be defined."));
            resolver.AddReference(id, nextLink);

            return nextLink;
        }
    }
}
