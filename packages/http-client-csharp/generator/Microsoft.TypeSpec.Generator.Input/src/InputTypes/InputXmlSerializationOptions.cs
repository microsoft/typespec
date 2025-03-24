// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
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

        public string Name { get; internal set; }

        public bool? Attribute { get; internal set; }

        public InputXmlNamespaceOptions? Namespace { get; internal set; }

        public bool? Unwrapped { get; internal set; }

        public string? ItemsName { get; internal set; }

        public InputXmlNamespaceOptions? ItemsNamespace { get; internal set; }
    }
}
