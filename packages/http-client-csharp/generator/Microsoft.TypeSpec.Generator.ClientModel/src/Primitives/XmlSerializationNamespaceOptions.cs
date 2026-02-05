// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.ClientModel.Primitives
{
    public class XmlSerializationNamespaceOptions
    {
        public XmlSerializationNamespaceOptions(InputXmlNamespaceOptions options)
        {
            Namespace = options.Namespace;
            Prefix = options.Prefix;
        }

        public string Namespace { get; }

        public string Prefix { get; }
    }
}
