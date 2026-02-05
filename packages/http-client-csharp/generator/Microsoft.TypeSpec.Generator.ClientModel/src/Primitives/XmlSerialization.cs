// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.ClientModel.Primitives
{
    public class XmlSerialization
    {
        public XmlSerialization(InputXmlSerializationOptions xmlOptions)
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

        public XmlSerializationNamespace? Namespace { get; }

        public bool? Unwrapped { get; }

        public string? ItemsName { get; }

        public XmlSerializationNamespace? ItemsNamespace { get; }
    }
}
