// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Authentication.OAuth2
{
    /// <summary>
    /// OAuth2 client.
    /// </summary>
    public partial class OAuth2Client
    {
        /// <summary>
        /// The authorization scopes.
        /// </summary>
        public static string[] TokenScopes => AuthorizationScopes;
    }
}
