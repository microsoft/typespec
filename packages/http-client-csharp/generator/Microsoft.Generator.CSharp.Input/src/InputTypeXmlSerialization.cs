// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputTypeXmlSerialization
    {
        public InputTypeXmlSerialization(string? name, bool isAttribute, bool isContent, bool isWrapped)
        {
            Name = name;
            IsAttribute = isAttribute;
            IsContent = isContent;
            IsWrapped = isWrapped;
        }

        public string? Name { get; }
        public bool IsAttribute { get; }
        public bool IsContent { get; }
        public bool IsWrapped { get; }

    }
}
