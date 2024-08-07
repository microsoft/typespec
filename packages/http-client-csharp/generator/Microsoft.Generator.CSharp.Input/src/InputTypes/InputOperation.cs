// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input operation.
    /// </summary>
    public class InputOperation
    {
        public InputOperation(
            string name,
            string? resourceName,
            string description,
            string? deprecated,
            string? accessibility,
            IReadOnlyList<InputParameter> parameters,
            IReadOnlyList<OperationResponse> responses,
            string httpMethod,
            BodyMediaType requestBodyMediaType,
            string uri,
            string path,
            string? externalDocsUrl,
            IReadOnlyList<string>? requestMediaTypes,
            bool bufferResponse,
            OperationLongRunning? longRunning,
            OperationPaging? paging,
            bool generateProtocolMethod,
            bool generateConvenienceMethod,
            string crossLanguageDefinitionId)
        {
            Name = name;
            ResourceName = resourceName;
            Description = description;
            Deprecated = deprecated;
            Accessibility = accessibility;
            Parameters = parameters;
            Responses = responses;
            HttpMethod = httpMethod;
            RequestBodyMediaType = requestBodyMediaType;
            Uri = uri;
            Path = path;
            ExternalDocsUrl = externalDocsUrl;
            RequestMediaTypes = requestMediaTypes;
            BufferResponse = bufferResponse;
            LongRunning = longRunning;
            Paging = paging;
            GenerateProtocolMethod = generateProtocolMethod;
            GenerateConvenienceMethod = generateConvenienceMethod;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
        }

        public InputOperation() : this(
            name: string.Empty,
            resourceName: null,
            description: string.Empty,
            deprecated: null,
            accessibility: null,
            parameters: Array.Empty<InputParameter>(),
            responses: Array.Empty<OperationResponse>(),
            httpMethod: string.Empty,
            requestBodyMediaType: BodyMediaType.None,
            uri: string.Empty,
            path: string.Empty,
            externalDocsUrl: null,
            requestMediaTypes: Array.Empty<string>(),
            bufferResponse: false,
            longRunning: null,
            paging: null,
            generateProtocolMethod: true,
            generateConvenienceMethod: false,
            crossLanguageDefinitionId: string.Empty)
        { }

        public string Name { get; internal set; }
        public string? ResourceName { get; internal set; }
        public string Description { get; internal set; }
        public string? Deprecated { get; internal set; }
        public string? Accessibility { get; internal set; }
        public IReadOnlyList<InputParameter> Parameters { get; internal set; }
        public IReadOnlyList<OperationResponse> Responses { get; internal set; }
        public string HttpMethod { get; internal set; }
        public BodyMediaType RequestBodyMediaType { get; internal set; }
        public string Uri { get; internal set; }
        public string Path { get; internal set; }
        public string? ExternalDocsUrl { get; internal set; }
        public IReadOnlyList<string>? RequestMediaTypes { get; internal set; }
        public bool BufferResponse { get; internal set; }
        public OperationLongRunning? LongRunning { get; internal set; }
        public OperationPaging? Paging { get; internal set; }
        public bool GenerateProtocolMethod { get; internal set; }
        public bool GenerateConvenienceMethod { get; internal set; }
        public string CrossLanguageDefinitionId { get; internal set; }

        private IReadOnlyDictionary<string, InputOperationExample>? _examples;
        internal IReadOnlyDictionary<string, InputOperationExample> Examples => _examples ??= EnsureExamples();

        private IReadOnlyDictionary<string, InputOperationExample> EnsureExamples()
        {
            return new Dictionary<string, InputOperationExample>()
            {
                [ExampleMockValueBuilder.ShortVersionMockExampleKey] = ExampleMockValueBuilder.BuildOperationExample(this, false),
                [ExampleMockValueBuilder.MockExampleAllParameterKey] = ExampleMockValueBuilder.BuildOperationExample(this, true)
            };
        }
    }
}
