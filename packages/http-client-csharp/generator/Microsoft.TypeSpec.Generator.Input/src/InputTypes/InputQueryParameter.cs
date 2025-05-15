// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputQueryParameter : InputProperty
    {
        public InputQueryParameter(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, string? collectionFormat, string serializedName, bool explode) : base(name, summary, doc, type, isRequired, isReadOnly, access)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            CollectionFormat = collectionFormat;
            SerializedName = serializedName;
            Explode = explode;
        }

        public string? CollectionFormat { get; internal set; }
        public string SerializedName { get; internal set; }
        public bool Explode { get; internal set; }
    }
}
