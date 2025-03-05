// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecNextLinkConverter : JsonConverter<NextLink>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecNextLinkConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override NextLink? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<NextLink>(_referenceHandler.CurrentResolver) ?? CreateNextLink(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, NextLink value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static NextLink CreateNextLink(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            reader.TryReadReferenceId(ref id);

            id = id ?? throw new JsonException();

            InputOperation? operation = null;
            IReadOnlyList<string>? responseSegments = null;
            ResponseLocation? responseLocation = null;

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("Operation", options, ref operation)
                    || reader.TryReadComplexType("ResponseSegments", options, ref responseSegments)
                    || reader.TryReadComplexType("ResponseLocation", options, ref responseLocation);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var nextLink = new NextLink(
                operation,
                responseSegments ?? throw new JsonException("NextLink response segments must be defined."),
                responseLocation ?? throw new JsonException("NextLink response location must be defined."));
            resolver.AddReference(id, nextLink);

            return nextLink;
        }
    }
}
