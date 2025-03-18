// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputServiceMethodConverter : JsonConverter<InputServiceMethod>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        private const string BasicKind = "basic";
        private const string PagingKind = "paging";
        private const string LongRunningKind = "lro";
        private const string LongRunningPagingKind = "lropaging";

        public TypeSpecInputServiceMethodConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputServiceMethod? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputServiceMethod>(_referenceHandler.CurrentResolver) ?? CreateInputServiceMethod(ref reader, options, _referenceHandler.CurrentResolver);
        }

        public override void Write(Utf8JsonWriter writer, InputServiceMethod value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputServiceMethod CreateInputServiceMethod(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            string? kind = null;
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

            InputServiceMethod? method;
            var isFirstProperty = true;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrKind = reader.TryReadReferenceId(ref isFirstProperty, ref id) || reader.TryReadString("kind", ref kind);

                if (isIdOrKind)
                {
                    continue;
                }
                var isKnownProperty = reader.TryReadString("name", ref name)
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
                throw new JsonException();
            }
            if (kind == null)
            {
                throw new JsonException($"InputServiceMethod (id: '{id}', must have a 'kind' property");
            }

            method = kind switch
            {
                BasicKind => new InputBasicServiceMethod(),
                PagingKind => new InputPagingServiceMethod(),
                LongRunningKind => new InputLongRunningServiceMethod(),
                LongRunningPagingKind => new InputLongRunningPagingServiceMethod(),
                _ => new InputBasicServiceMethod(),
            };

            method.Name = name ?? throw new JsonException("InputServiceMethod must have name");
            method.Accessibility = accessibility;
            method.ApiVersions = apiVersions ?? [];
            method.Documentation = doc;
            method.Summary = summary;
            method.Operation = operation ?? throw new JsonException("InputServiceMethod must have an operation");
            method.Parameters = parameters ?? [];
            method.Response = response ?? throw new JsonException("InputServiceMethod must have a response");
            method.Exception = exception;
            method.IsOverride = isOverride;
            method.GenerateConvenient = generateConvenient;
            method.GenerateProtocol = generateProtocol;
            method.CrossLanguageDefinitionId = crossLanguageDefinitionId ?? throw new JsonException("InputServiceMethod must have crossLanguageDefinitionId");

            resolver.AddReference(id, method);

            return method;
        }
    }
}
