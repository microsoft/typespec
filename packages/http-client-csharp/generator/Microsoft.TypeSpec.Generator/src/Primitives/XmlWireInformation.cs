// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public class XmlWireInformation
    {
        public XmlWireInformation(InputXmlSerializationOptions xmlOptions)
        {
            Name = xmlOptions.Name;
            Attribute = xmlOptions.Attribute;
            Namespace = xmlOptions.Namespace != null
                ? new(xmlOptions.Namespace)
                : null;
            Unwrapped = xmlOptions.Unwrapped;
            ItemsName = xmlOptions.ItemsName;
            ItemsNamespace = xmlOptions.ItemsNamespace != null
                ? new(xmlOptions.ItemsNamespace)
                : null;
        }

        public string Name { get; }

        public bool? Attribute { get; }

        public XmlWireNamespaceOptions? Namespace { get; }

        public bool? Unwrapped { get; }

        public string? ItemsName { get; }

        public XmlWireNamespaceOptions? ItemsNamespace { get; }
    }
}
