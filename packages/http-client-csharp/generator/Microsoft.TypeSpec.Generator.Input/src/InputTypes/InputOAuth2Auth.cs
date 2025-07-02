// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents oauth2auth information.
    /// </summary>
    /// <summary>

    /// Gets the inputoauth2auth.

    /// </summary>

    public class InputOAuth2Auth
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputOAuth2Auth"/> class.
        /// </summary>
        public InputOAuth2Auth(IReadOnlyCollection<string> scopes)
        {
            Scopes = scopes;
        }        /// <summary>
        /// Gets the scopes.
        /// </summary>
        public IReadOnlyCollection<string> Scopes { get; }
    }
}
