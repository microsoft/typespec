// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents apikeyauth information.
    /// </summary>
    /// <summary>

    /// Gets the inputapikeyauth.

    /// </summary>

    public class InputApiKeyAuth
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputApiKeyAuth"/> class.
        /// </summary>
        public InputApiKeyAuth(string name, string? prefix)
        {
            Name = name;
            Prefix = prefix;
        }        /// <summary>
        /// Gets the  name.
        /// </summary>
        public string Name { get; }        /// <summary>
        /// Gets the prefix.
        /// </summary>
        public string? Prefix { get; }
    }
}
