// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputQueryParameter : InputParameter
    {
        public InputQueryParameter(
            string name,
            string? summary,
            string? doc,
            InputType type,
            bool isRequired,
            bool isReadOnly,
            string? access,
            string serializedName,
            string? collectionFormat,
            bool explode,
            bool isApiVersion,
            InputConstant? defaultValue,
            InputParameterScope scope,
            string? arraySerializationDelimiter,
            IReadOnlyList<InputMethodParameter>? correspondingMethodParams = null)
            : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName, isApiVersion, defaultValue, scope)
        {
            CollectionFormat = collectionFormat;
            Explode = explode;
            ArraySerializationDelimiter = arraySerializationDelimiter;
            CorrespondingMethodParams = correspondingMethodParams;
        }

        public string? CollectionFormat { get; internal set; }
        public bool Explode { get; internal set; }
        public string? ArraySerializationDelimiter { get; internal set; }
        public IReadOnlyList<InputMethodParameter>? CorrespondingMethodParams { get; internal set; }
    }
}
