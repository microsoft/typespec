// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputPathParameter : InputProperty
    {
        public InputPathParameter(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, bool allowReserved, string serializedName) : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            AllowReserved = allowReserved;
        }

        public bool AllowReserved { get; internal set; }
    }
}
