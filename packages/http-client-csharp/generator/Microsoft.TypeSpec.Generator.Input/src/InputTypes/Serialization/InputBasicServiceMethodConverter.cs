// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputBasicServiceMethodConverter : JsonConverter<InputBasicServiceMethod>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputBasicServiceMethodConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputBasicServiceMethod? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputBasicServiceMethod>(_referenceHandler.CurrentResolver)
                ?? CreateInputBasicServiceMethod(ref reader, null, options, _referenceHandler.CurrentResolver);
        }

        public override void Write(Utf8JsonWriter writer, InputBasicServiceMethod value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputBasicServiceMethod CreateInputBasicServiceMethod(
            ref Utf8JsonReader reader,
            string? id,
            JsonSerializerOptions options,
            ReferenceResolver resolver)
        {
            string? name = null;
            string? accessibility = null;
            string[]? apiVersions = null;
            string? doc = null;
            string? summary = null;
            InputOperation? operation = null;
            IReadOnlyList<InputParameter>? parameters = null;
            InputServiceMethodResponse? response = null;
            InputServiceMethodResponse? exception = null;
            bool isOverride = false;
            bool generateConvenient = false;
            bool generateProtocol = false;
            string? crossLanguageDefinitionId = null;
            InputBasicServiceMethod? method;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadString("accessibility", ref accessibility)
                    || reader.TryReadComplexType("apiVersions", options, ref apiVersions)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadComplexType("operation", options, ref operation)
                    || reader.TryReadComplexType("parameters", options, ref parameters)
                    || reader.TryReadComplexType("response", options, ref response)
                    || reader.TryReadComplexType("exception", options, ref exception)
                    || reader.TryReadBoolean("isOverride", ref isOverride)
                    || reader.TryReadBoolean("generateConvenient", ref generateConvenient)
                    || reader.TryReadBoolean("generateProtocol", ref generateProtocol)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            if (id == null)
            {
                throw new JsonException($"InputBasicServiceMethod (name: '{name}', must have an 'id' property");
            }

            method = new InputBasicServiceMethod
            {
                Name = name ?? throw new JsonException("InputBasicServiceMethod must have name"),
                Accessibility = accessibility,
                ApiVersions = apiVersions ?? [],
                Documentation = doc,
                Summary = summary,
                Operation = operation ?? throw new JsonException("InputBasicServiceMethod must have an operation"),
                Parameters = parameters ?? [],
                Response = response ?? throw new JsonException("InputBasicServiceMethod must have a response"),
                Exception = exception,
                IsOverride = isOverride,
                GenerateConvenient = generateConvenient,
                GenerateProtocol = generateProtocol,
                CrossLanguageDefinitionId = crossLanguageDefinitionId ?? throw new JsonException("InputBasicServiceMethod must have crossLanguageDefinitionId")
            };

            resolver.AddReference(id, method);

            return method;
        }
    }
}
