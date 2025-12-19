// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputBodyParameter : InputParameter
    {
        public InputBodyParameter(
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
            InputParameterScope scope,
            IReadOnlyList<string> contentTypes,
            string defaultContentType)
            : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue, scope)
        {
            ContentTypes = contentTypes;
            DefaultContentType = defaultContentType;
        }

        public IReadOnlyList<string> ContentTypes { get; internal set; }
        public string DefaultContentType { get; internal set; }
    }
}
