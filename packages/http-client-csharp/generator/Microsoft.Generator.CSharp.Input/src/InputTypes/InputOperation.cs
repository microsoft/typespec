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
            string? summary,
            string? deprecated,
            string description,
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
            bool generateConvenienceMethod)
        {
            Name = name;
            ResourceName = resourceName;
            Summary = summary;
            Deprecated = deprecated;
            Description = description;
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
        }

        public InputOperation() : this(
            name: string.Empty,
            resourceName: null,
            summary: null,
            deprecated: null,
            description: string.Empty,
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
            generateConvenienceMethod: false)
        { }

        public string Name { get; init; }
        public string? ResourceName { get; init; }
        public string? Summary { get; init; }
        public string? Deprecated { get; init; }
        public string Description { get; init; }
        public string? Accessibility { get; init; }
        public IReadOnlyList<InputParameter> Parameters { get; init; }
        public IReadOnlyList<OperationResponse> Responses { get; init; }
        public string HttpMethod { get; init; }
        public BodyMediaType RequestBodyMediaType { get; init; }
        public string Uri { get; init; }
        public string Path { get; init; }
        public string? ExternalDocsUrl { get; init; }
        public IReadOnlyList<string>? RequestMediaTypes { get; init; }
        public bool BufferResponse { get; init; }
        public OperationLongRunning? LongRunning { get; init; }
        public OperationPaging? Paging { get; init; }
        public bool GenerateProtocolMethod { get; init; }
        public bool GenerateConvenienceMethod { get; init; }

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
