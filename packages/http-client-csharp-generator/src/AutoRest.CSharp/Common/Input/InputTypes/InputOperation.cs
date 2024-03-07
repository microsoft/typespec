// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input.Examples;
using AutoRest.CSharp.Utilities;
using Azure.Core;

namespace AutoRest.CSharp.Common.Input;

internal record InputOperation(
    string Name,
    string? ResourceName,
    string? Summary,
    string? Deprecated,
    string Description,
    string? Accessibility,
    IReadOnlyList<InputParameter> Parameters,
    IReadOnlyList<OperationResponse> Responses,
    RequestMethod HttpMethod,
    BodyMediaType RequestBodyMediaType,
    string Uri,
    string Path,
    string? ExternalDocsUrl,
    IReadOnlyList<string>? RequestMediaTypes,
    bool BufferResponse,
    OperationLongRunning? LongRunning,
    OperationPaging? Paging,
    bool GenerateProtocolMethod,
    bool GenerateConvenienceMethod)
{
    public InputOperation() : this(
        Name: string.Empty,
        ResourceName: null,
        Summary: null,
        Deprecated: null,
        Description: string.Empty,
        Accessibility: null,
        Parameters: Array.Empty<InputParameter>(),
        Responses: Array.Empty<OperationResponse>(),
        HttpMethod: RequestMethod.Get,
        RequestBodyMediaType: BodyMediaType.None,
        Uri: string.Empty,
        Path: string.Empty,
        ExternalDocsUrl: null,
        RequestMediaTypes: Array.Empty<string>(),
        BufferResponse: false,
        LongRunning: null,
        Paging: null,
        GenerateProtocolMethod: true,
        GenerateConvenienceMethod: false)
    { }

    public static InputOperation RemoveApiVersionParam(InputOperation operation)
    {
        return new InputOperation(
            operation.Name,
            operation.ResourceName,
            operation.Summary,
            operation.Deprecated,
            operation.Description,
            operation.Accessibility,
            operation.Parameters.Where(p => !p.IsApiVersion).ToList(),
            operation.Responses,
            operation.HttpMethod,
            operation.RequestBodyMediaType,
            operation.Uri,
            operation.Path,
            operation.ExternalDocsUrl,
            operation.RequestMediaTypes,
            operation.BufferResponse,
            operation.LongRunning,
            operation.Paging,
            operation.GenerateProtocolMethod,
            operation.GenerateConvenienceMethod);
    }

    private string? _cleanName;
    public string CleanName
    {
        get
        {
            if (_cleanName == null)
            {
                _cleanName = Name.IsNullOrEmpty() ? string.Empty : Name.ToCleanName();
            }

            return _cleanName;
        }
    }

    public bool KeepClientDefaultValue { get; set; } = Configuration.MethodsToKeepClientDefaultValue.Contains(Name);

    private IReadOnlyDictionary<string, InputOperationExample>? _examples;
    public IReadOnlyDictionary<string, InputOperationExample> Examples => _examples ??= EnsureExamples();

    private IReadOnlyDictionary<string, InputOperationExample> EnsureExamples()
    {
        return new Dictionary<string, InputOperationExample>()
        {
            [ExampleMockValueBuilder.ShortVersionMockExampleKey] = ExampleMockValueBuilder.BuildOperationExample(this, false),
            [ExampleMockValueBuilder.MockExampleAllParameterKey] = ExampleMockValueBuilder.BuildOperationExample(this, true)
        };
    }
}
