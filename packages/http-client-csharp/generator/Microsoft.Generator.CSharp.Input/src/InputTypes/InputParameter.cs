// Copyright (c) Microsoft Corporation. All rights reserved.
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

        public string Name { get; internal set; }
        public string NameInRequest { get; internal set; }
        public string? Description { get; internal set; }
        public InputType Type { get; internal set; }
        public RequestLocation Location { get; internal set; }
        public InputConstant? DefaultValue { get; internal set; }
        public InputParameter? GroupedBy { get; internal set; }
        public InputOperationParameterKind Kind { get; internal set; }
        public bool IsRequired { get; internal set; }
        public bool IsApiVersion { get; internal set; }
        public bool IsResourceParameter { get; internal set; }
        public bool IsContentType { get; internal set; }
        public bool IsEndpoint { get; internal set; }
        public bool SkipUrlEncoding { get; internal set; }
        public bool Explode { get; internal set; }
        public string? ArraySerializationDelimiter { get; internal set; }
        public string? HeaderCollectionPrefix { get; internal set; }
    }
}
