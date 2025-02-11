// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputXmlNamespaceOptions
    {
        public InputXmlNamespaceOptions(string ns, string prefix)
        {
            Namespace = ns;
            Prefix = prefix;
        }

        public string Namespace { get; internal set; }

        public string Prefix { get; internal set; }
    }
}
