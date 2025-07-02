// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents xmlnamespaceoptions information.
    /// </summary>
    /// <summary>

    /// Gets the inputxmlnamespaceoptions.

    /// </summary>

    public class InputXmlNamespaceOptions
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputXmlNamespaceOptions"/> class.
        /// </summary>
        public InputXmlNamespaceOptions(string ns, string prefix)
        {
            Namespace = ns;
            Prefix = prefix;
        }        /// <summary>
        /// Gets the namespace.
        /// </summary>
        public string Namespace { get; internal set; }        /// <summary>
        /// Gets the prefix.
        /// </summary>
        public string Prefix { get; internal set; }
    }
}
