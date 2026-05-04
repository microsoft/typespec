// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputPathParameter : InputParameter
    {
        public InputPathParameter(
            string name,
            string? summary,
            string? doc,
            InputType type,
            bool isRequired,
            bool isReadOnly,
            string? access,
            bool allowReserved,
            string serializedName,
            bool isApiVersion,
            InputConstant? defaultValue,
            InputParameterScope scope,
            bool explode,
            bool skipUrlEncoding,
            string? serverUrlTemplate)
            : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue, scope)
        {
            Explode = explode;
            AllowReserved = allowReserved;
            SkipUrlEncoding = skipUrlEncoding;
            ServerUrlTemplate = serverUrlTemplate;
        }

        public bool Explode { get; internal set; }
        public bool AllowReserved { get; internal set; }
        public bool SkipUrlEncoding { get; internal set; }
        public string? ServerUrlTemplate { get; internal set; }
    }
}
