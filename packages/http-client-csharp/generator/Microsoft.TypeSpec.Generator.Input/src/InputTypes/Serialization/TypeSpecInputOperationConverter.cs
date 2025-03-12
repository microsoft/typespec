// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputOperationConverter : JsonConverter<InputOperation>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputOperationConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputOperation? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputOperation>(_referenceHandler.CurrentResolver) ?? CreateInputOperation(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputOperation value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputOperation? CreateInputOperation(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }
            string? id = null;
            reader.TryReadReferenceId(ref id);
            id = id ?? throw new JsonException();

            var operation = new InputOperation();
            resolver.AddReference(id, operation);

            string? name = null;
            string? resourceName = null;
            string? summary = null;
            string? doc = null;
            string? deprecated = null;
            string? accessibility = null;
            IReadOnlyList<InputParameter>? parameters = null;
            IReadOnlyList<InputOperationResponse>? responses = null;
            string? httpMethod = null;
            string? uri = null;
            string? path = null;
            string? externalDocsUrl = null;
            IReadOnlyList<string>? requestMediaTypes = null;
            bool bufferResponse = false;
            InputOperationLongRunning? longRunning = null;
            InputOperationPaging? paging = null;
            bool generateProtocolMethod = false;
            bool generateConvenienceMethod = false;
            string? crossLanguageDefinitionId = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("resourceName", ref resourceName)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadString("deprecated", ref deprecated)
                    || reader.TryReadString("accessibility", ref accessibility)
                    || reader.TryReadComplexType("parameters", options, ref parameters)
                    || reader.TryReadComplexType("responses", options, ref responses)
                    || reader.TryReadString("httpMethod", ref httpMethod)
                    || reader.TryReadString("uri", ref uri)
                    || reader.TryReadString("path", ref path)
                    || reader.TryReadString("externalDocsUrl", ref externalDocsUrl)
                    || reader.TryReadComplexType("requestMediaTypes", options, ref requestMediaTypes)
                    || reader.TryReadBoolean("bufferResponse", ref bufferResponse)
                    || reader.TryReadComplexType("longRunning", options, ref longRunning)
                    || reader.TryReadComplexType("paging", options, ref paging)
                    || reader.TryReadBoolean("generateProtocolMethod", ref generateProtocolMethod)
                    || reader.TryReadBoolean("generateConvenienceMethod", ref generateConvenienceMethod)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            operation.Name = name ?? throw new JsonException("InputOperation must have name");
            operation.ResourceName = resourceName;
            operation.Summary = summary;
            operation.Doc = doc;
            operation.Deprecated = deprecated;
            operation.Accessibility = accessibility;
            operation.Parameters = parameters ?? Array.Empty<InputParameter>();
            operation.Responses = responses ?? Array.Empty<InputOperationResponse>();
            operation.HttpMethod = httpMethod ?? throw new JsonException("InputOperation must have HttpMethod");
            operation.Uri = uri ?? throw new JsonException("InputOperation must have Uri");
            operation.Path = path ?? throw new JsonException("InputOperation must have Path");
            operation.ExternalDocsUrl = externalDocsUrl;
            operation.RequestMediaTypes = requestMediaTypes;
            operation.BufferResponse = bufferResponse;
            operation.LongRunning = longRunning;
            operation.Paging = paging;
            operation.GenerateProtocolMethod = generateProtocolMethod;
            operation.GenerateConvenienceMethod = generateConvenienceMethod;
            operation.CrossLanguageDefinitionId = crossLanguageDefinitionId ?? throw new JsonException("InputOperation must have CrossLanguageDefinitionId");
            operation.Decorators = decorators ?? [];

            return operation;
        }
    }
}
