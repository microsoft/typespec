// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Demonstrates creating a client with an unbranded authentication token provider.
using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace UnbrandedTypeSpec
{
    /// <summary>
    /// Demonstrates creating a client with an unbranded authentication token provider.
    /// </summary>
    public partial class UnbrandedTypeSpecClient
    {
        private readonly Dictionary<string, object>[] flows = [
            new Dictionary<string, object> {
                    { GetTokenOptions.ScopesPropertyName, new string[] { "baselineScope" } },
                    { GetTokenOptions.TokenUrlPropertyName , "https://myauthserver.com/token"},
                    { GetTokenOptions.RefreshUrlPropertyName, "https://myauthserver.com/refresh"}
                }
        ];

        /// <summary>
        /// Initializes a new instance of the <see cref="UnbrandedTypeSpecClient"/> class.
        /// </summary>
        /// <param name="uri">The URI of the service.</param>
        /// <param name="credential">The authentication token provider.</param>
        public UnbrandedTypeSpecClient(Uri uri, AuthenticationTokenProvider credential)
        {
            var options = new ClientPipelineOptions();
            Pipeline = ClientPipeline.Create(options,
            perCallPolicies: ReadOnlySpan<PipelinePolicy>.Empty,
            perTryPolicies: [new OAuth2BearerTokenAuthenticationPolicy(credential, flows)],
            beforeTransportPolicies: ReadOnlySpan<PipelinePolicy>.Empty);
        }
    }
}
