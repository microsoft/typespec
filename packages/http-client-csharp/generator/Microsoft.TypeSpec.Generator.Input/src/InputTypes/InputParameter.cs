// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputParameter
    {
        private readonly bool _isApiVersion;

        public InputParameter(
            string name,
            string nameInRequest,
            string? summary,
            string? doc,
            InputType type,
            InputRequestLocation location,
            InputConstant? defaultValue,
            InputOperationParameterKind kind,
            bool isRequired,
            bool isApiVersion,
            bool isContentType,
            bool isEndpoint,
            bool skipUrlEncoding,
            bool explode,
            string? arraySerializationDelimiter,
            string? headerCollectionPrefix)
        {
            Name = name;
            NameInRequest = nameInRequest;
            Summary = summary;
            Doc = doc;
            Type = type;
            Location = location;
            DefaultValue = defaultValue;
            Kind = kind;
            IsRequired = isRequired;
            _isApiVersion = isApiVersion;
            IsContentType = isContentType;
            IsEndpoint = isEndpoint;
            SkipUrlEncoding = skipUrlEncoding;
            Explode = explode;
            ArraySerializationDelimiter = arraySerializationDelimiter;
            HeaderCollectionPrefix = headerCollectionPrefix;
        }

        public string Name { get; }
        public string NameInRequest { get; }
        public string? Summary { get; }
        public string? Doc { get; }
        public InputType Type { get; }
        public InputRequestLocation Location { get; }
        public InputConstant? DefaultValue { get; }
        public InputOperationParameterKind Kind { get; }
        public bool IsRequired { get; }
        public bool IsApiVersion => _isApiVersion || Type is InputEnumType enumType && enumType.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum);
        public bool IsContentType { get; }
        public bool IsEndpoint { get; }
        public bool SkipUrlEncoding { get; }
        public bool Explode { get; }
        public string? ArraySerializationDelimiter { get; }
        public string? HeaderCollectionPrefix { get; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
    }
}
