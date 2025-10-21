// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputHeaderParameter : InputParameter
    {
        public InputHeaderParameter(
            string name,
            string? summary,
            string? doc,
            InputType type,
            bool isRequired,
            bool isReadOnly,
            string? access,
            string? collectionFormat,
            string serializedName,
            bool isApiVersion,
            InputConstant? defaultValue,
            InputParameterScope scope,
            string? arraySerializationDelimiter,
            bool isContentType)
            : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue, scope)
        {
            CollectionFormat = collectionFormat;
            ArraySerializationDelimiter = arraySerializationDelimiter;
            IsContentType = isContentType;
        }

        public string? CollectionFormat { get; internal set; }
        public string? ArraySerializationDelimiter { get; internal set; }
        public bool IsContentType { get; internal set; }
    }
}
