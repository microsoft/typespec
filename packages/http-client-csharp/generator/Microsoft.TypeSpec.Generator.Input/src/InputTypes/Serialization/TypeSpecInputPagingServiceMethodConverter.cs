// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputPagingServiceMethodConverter : JsonConverter<InputPagingServiceMethod>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputPagingServiceMethodConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputPagingServiceMethod? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputPagingServiceMethod>(_referenceHandler.CurrentResolver)
                ?? CreateInputPagingServiceMethod(ref reader, null, null, options, _referenceHandler.CurrentResolver);
        }

        public override void Write(Utf8JsonWriter writer, InputPagingServiceMethod value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputPagingServiceMethod CreateInputPagingServiceMethod(
            ref Utf8JsonReader reader,
            string? id,
            string? name,
            JsonSerializerOptions options,
            ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && name == null;
            string? accessibility = null;
            string[]? apiVersions = null;
            string? doc = null;
            string? summary = null;
            InputOperation? operation = null;
            IReadOnlyList<InputParameter>? parameters = null;
            InputServiceMethodResponse? response = null;
            InputServiceMethodResponse? exception = null;
            InputPagingServiceMetadata? pagingMetadata = null;
            bool isOverride = false;
            bool generateConvenient = false;
            bool generateProtocol = false;
            string? crossLanguageDefinitionId = null;
            InputPagingServiceMethod? method;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
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
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadComplexType("pagingMetadata", options, ref pagingMetadata);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            if (id == null)
            {
                throw new JsonException($"InputPagingServiceMethod (name: '{name}', must have an 'id' property");
            }
            if (pagingMetadata == null)
            {
                throw new JsonException($"InputPagingServiceMethod (name: '{name}') must have a 'pagingMetadata' property");
            }

            method = new InputPagingServiceMethod
            {
                Name = name ?? throw new JsonException("InputPagingServiceMethod must have name"),
                Accessibility = accessibility,
                ApiVersions = apiVersions ?? [],
                Documentation = doc,
                Summary = summary,
                Operation = operation ?? throw new JsonException("InputPagingServiceMethod must have an operation"),
                Parameters = parameters ?? [],
                Response = response ?? throw new JsonException("InputPagingServiceMethod must have a response"),
                Exception = exception,
                IsOverride = isOverride,
                GenerateConvenient = generateConvenient,
                GenerateProtocol = generateProtocol,
                CrossLanguageDefinitionId = crossLanguageDefinitionId ?? throw new JsonException("InputPagingServiceMethod must have crossLanguageDefinitionId"),
                PagingMetadata = pagingMetadata
            };

            resolver.AddReference(id, method);

            return method;
        }
    }
}
