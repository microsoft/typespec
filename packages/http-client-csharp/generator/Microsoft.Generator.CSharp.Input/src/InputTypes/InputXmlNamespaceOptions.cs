// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputXmlNamespaceOptions
    {
        public InputXmlNamespaceOptions(string ns, string prefix)
        {
            Namespace = ns;
            Prefix = prefix;
        }

        public string Namespace { get; init; }

        public string Prefix { get; init; }
    }
}
