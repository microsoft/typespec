// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputNextLinkConverter : JsonConverter<InputNextLink>
    {
        public InputNextLinkConverter()
        {
        }

        public override InputNextLink? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateNextLink(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputNextLink value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputNextLink CreateNextLink(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            InputOperation? operation = null;
            IReadOnlyList<string>? responseSegments = null;
            InputResponseLocation? responseLocation = null;
            IReadOnlyList<InputParameter>? reInjectedParameters = null;

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("operation", options, ref operation)
                    || reader.TryReadComplexType("responseSegments", options, ref responseSegments)
                    || reader.TryReadComplexType("responseLocation", options, ref responseLocation)
                    || reader.TryReadComplexType("reInjectedParameters", options, ref reInjectedParameters);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var nextLink = new InputNextLink(
                operation,
                responseSegments ?? throw new JsonException("NextLink response segments must be defined."),
                responseLocation ?? throw new JsonException("NextLink response location must be defined."),
                reInjectedParameters);

            return nextLink;
        }
    }
}
