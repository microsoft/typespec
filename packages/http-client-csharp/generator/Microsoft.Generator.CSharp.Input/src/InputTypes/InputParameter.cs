﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputParameter
    {
        public InputParameter(
            string name,
            string nameInRequest,
            string? description,
            InputType type,
            RequestLocation location,
            InputConstant? defaultValue,
            InputParameter? groupedBy,
            InputOperationParameterKind kind,
            bool isRequired,
            bool isApiVersion,
            bool isResourceParameter,
            bool isContentType,
            bool isEndpoint,
            bool skipUrlEncoding,
            bool explode,
            string? arraySerializationDelimiter,
            string? headerCollectionPrefix)
        {
            Name = name;
            NameInRequest = nameInRequest;
            Description = description;
            Type = type;
            Location = location;
            DefaultValue = defaultValue;
            GroupedBy = groupedBy;
            Kind = kind;
            IsRequired = isRequired;
            IsApiVersion = isApiVersion;
            IsResourceParameter = isResourceParameter;
            IsContentType = isContentType;
            IsEndpoint = isEndpoint;
            SkipUrlEncoding = skipUrlEncoding;
            Explode = explode;
            ArraySerializationDelimiter = arraySerializationDelimiter;
            HeaderCollectionPrefix = headerCollectionPrefix;
        }

        public InputParameter() : this(
            name: string.Empty,
            nameInRequest: string.Empty,
            description: null,
            type: InputPrimitiveType.Object,
            location: RequestLocation.None,
            defaultValue: null,
            groupedBy: null,
            kind: InputOperationParameterKind.Method,
            isRequired: false,
            isApiVersion: false,
            isResourceParameter: false,
            isContentType: false,
            isEndpoint: false,
            skipUrlEncoding: false,
            explode: false,
            arraySerializationDelimiter: null,
            headerCollectionPrefix: null)
        { }

        public string Name { get; }
        public string NameInRequest { get; }
        public string? Description { get; }
        public InputType Type { get; }
        public RequestLocation Location { get; }
        public InputConstant? DefaultValue { get; }
        public InputParameter? GroupedBy { get; }
        public InputOperationParameterKind Kind { get; }
        public bool IsRequired { get; }
        public bool IsApiVersion { get; }
        public bool IsResourceParameter { get; }
        public bool IsContentType { get; }
        public bool IsEndpoint { get; }
        public bool SkipUrlEncoding { get; }
        public bool Explode { get; }
        public string? ArraySerializationDelimiter { get; }
        public string? HeaderCollectionPrefix { get; }
    }
}
