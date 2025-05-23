// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputHeaderParameter : InputProperty
    {
        public InputHeaderParameter(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, string? collectionFormat, string serializedName) : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            CollectionFormat = collectionFormat;
            SerializedName = serializedName;
        }

        public string? CollectionFormat { get; internal set; }
    }
}
