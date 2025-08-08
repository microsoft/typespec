// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputEndpointParameter : InputParameter
    {
        public InputEndpointParameter(
           string name,
           string? summary,
           string? doc,
           InputType type,
           bool isRequired,
           bool isReadOnly,
           string? access,
           string serializedName,
           bool isApiVersion,
           InputConstant? defaultValue,
           InputParameterKind kind,
           bool skipUrlEncoding,
           string? serverUrlTemplate,
           bool isEndpoint)
           : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue, kind)
        {
            SkipUrlEncoding = skipUrlEncoding;
            ServerUrlTemplate = serverUrlTemplate;
            IsEndpoint = isEndpoint;
        }

        public bool SkipUrlEncoding { get; internal set; }
        public string? ServerUrlTemplate { get; internal set; }
        public bool IsEndpoint { get; internal set; }
    }
}
