// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputXmlSerializationOptions
    {
        public InputXmlSerializationOptions(string name, bool? attribute = null, InputXmlNamespaceOptions? @namespace = null, bool? unwrapped = null, string? itemsName = null, InputXmlNamespaceOptions? itemsNamespace = null)
        {
            Name = name;
            Attribute = attribute;
            Namespace = @namespace;
            Unwrapped = unwrapped;
            ItemsName = itemsName;
            ItemsNamespace = itemsNamespace;
        }

        public string Name { get; init; }

        public bool? Attribute { get; init; }

        public InputXmlNamespaceOptions? Namespace { get; init; }

        public bool? Unwrapped { get; init; }

        public string? ItemsName { get; init; }

        public InputXmlNamespaceOptions? ItemsNamespace { get; init; }
    }
}
