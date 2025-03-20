// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputContinuationTokenConverter : JsonConverter<InputContinuationToken>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputContinuationTokenConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputContinuationToken? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputContinuationToken>(_referenceHandler.CurrentResolver) ?? CreateContinuationToken(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputContinuationToken value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputContinuationToken CreateContinuationToken(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            reader.TryReadReferenceId(ref id);

            id = id ?? throw new JsonException();

            InputParameter? parameter = null;
            IReadOnlyList<string>? responseSegments = null;
            InputResponseLocation? responseLocation = null;

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("parameter", options, ref parameter)
                    || reader.TryReadComplexType("responseSegments", options, ref responseSegments)
                    || reader.TryReadComplexType("responseLocation", options, ref responseLocation);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var continuationToken = new InputContinuationToken(
                parameter ?? throw new JsonException("Continuation token parameter must be defined."),
                responseSegments ?? throw new JsonException("Continuation token response segments must be defined."),
                responseLocation ?? throw new JsonException("Continuation token response location must be defined."));

            resolver.AddReference(id, continuationToken);
            return continuationToken;
        }
    }
}
