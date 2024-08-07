// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
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
            string? description = null;
            string? deprecated = null;
            string? accessibility = null;
            IReadOnlyList<InputParameter>? parameters = null;
            IReadOnlyList<OperationResponse>? responses = null;
            string? httpMethod = null;
            BodyMediaType requestBodyMediaType = default;
            string? uri = null;
            string? path = null;
            string? externalDocsUrl = null;
            IReadOnlyList<string>? requestMediaTypes = null;
            bool bufferResponse = false;
            OperationLongRunning? longRunning = null;
            OperationPaging? paging = null;
            bool generateProtocolMethod = false;
            bool generateConvenienceMethod = false;
            string? crossLanguageDefinitionId = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString(nameof(InputOperation.Name), ref name)
                    || reader.TryReadString(nameof(InputOperation.ResourceName), ref resourceName)
                    || reader.TryReadString(nameof(InputOperation.Description), ref description)
                    || reader.TryReadString(nameof(InputOperation.Deprecated), ref deprecated)
                    || reader.TryReadString(nameof(InputOperation.Accessibility), ref accessibility)
                    || reader.TryReadWithConverter(nameof(InputOperation.Parameters), options, ref parameters)
                    || reader.TryReadWithConverter(nameof(InputOperation.Responses), options, ref responses)
                    || reader.TryReadString(nameof(InputOperation.HttpMethod), ref httpMethod)
                    || reader.TryReadWithConverter(nameof(InputOperation.RequestBodyMediaType), options, ref requestBodyMediaType)
                    || reader.TryReadString(nameof(InputOperation.Uri), ref uri)
                    || reader.TryReadString(nameof(InputOperation.Path), ref path)
                    || reader.TryReadString(nameof(InputOperation.ExternalDocsUrl), ref externalDocsUrl)
                    || reader.TryReadWithConverter(nameof(InputOperation.RequestMediaTypes), options, ref requestMediaTypes)
                    || reader.TryReadBoolean(nameof(InputOperation.BufferResponse), ref bufferResponse)
                    || reader.TryReadWithConverter(nameof(InputOperation.LongRunning), options, ref longRunning)
                    || reader.TryReadWithConverter(nameof(InputOperation.Paging), options, ref paging)
                    || reader.TryReadBoolean(nameof(InputOperation.GenerateProtocolMethod), ref generateProtocolMethod)
                    || reader.TryReadBoolean(nameof(InputOperation.GenerateConvenienceMethod), ref generateConvenienceMethod)
                    || reader.TryReadString(nameof(InputOperation.CrossLanguageDefinitionId), ref crossLanguageDefinitionId);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            operation.Name = name ?? throw new JsonException("InputOperation must have name");
            operation.ResourceName = resourceName;
            operation.Description = description ?? name; // default to name to avoid a case that we do not have description (and leads to no xml doc at all)
            operation.Deprecated = deprecated;
            operation.Accessibility = accessibility;
            operation.Parameters = parameters ?? Array.Empty<InputParameter>();
            operation.Responses = responses ?? Array.Empty<OperationResponse>();
            operation.HttpMethod = httpMethod ?? throw new JsonException("InputOperation must have HttpMethod");
            operation.RequestBodyMediaType = requestBodyMediaType;
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

            return operation;
        }
    }
}
