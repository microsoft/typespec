// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Authentication.Union
{
    public partial class UnionClient
    {
        /// <summary>
        /// Gets the scopes required for authentication.
        /// </summary>
        public static string[] TokenScopes => AuthorizationScopes;
    }
}
