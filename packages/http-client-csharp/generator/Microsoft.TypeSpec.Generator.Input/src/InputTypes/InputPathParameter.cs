// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

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
            string? serverUrlTemplate,
            IReadOnlyList<InputMethodParameter>? correspondingMethodParams = null)
            : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue, scope)
        {
            Explode = explode;
            AllowReserved = allowReserved;
            SkipUrlEncoding = skipUrlEncoding;
            ServerUrlTemplate = serverUrlTemplate;
            CorrespondingMethodParams = correspondingMethodParams;
        }

        public bool Explode { get; internal set; }
        public bool AllowReserved { get; internal set; }
        public bool SkipUrlEncoding { get; internal set; }
        public string? ServerUrlTemplate { get; internal set; }
        public IReadOnlyList<InputMethodParameter>? CorrespondingMethodParams { get; internal set; }
    }
}
