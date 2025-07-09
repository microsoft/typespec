// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputOAuth2Flow
    {
        public InputOAuth2Flow(
           IReadOnlyCollection<string> scopes,
           string? authorizationUrl,
           string? tokenUrl,
           string? refreshUrl)
        {
            Scopes = scopes;
            AuthorizationUrl = authorizationUrl;
            TokenUrl = tokenUrl;
            RefreshUrl = refreshUrl;
        }

        public IReadOnlyCollection<string> Scopes { get; }
        public string? AuthorizationUrl { get; }
        public string? TokenUrl { get; }
        public string? RefreshUrl { get; }
    }
}
