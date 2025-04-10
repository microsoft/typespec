// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace SampleTypeSpec
{
    /// <summary>
    /// Demonstrates creating a custom client constructor to enable OAuth authentication.
    /// </summary>
    public partial class SampleTypeSpecClient
    {
        // If generated, flows would come from the service level OAuth2 flow definitions as shown in the Oauth2 Scopes section of this: https://typespec.io/docs/libraries/http/authentication/
        private readonly Dictionary<string, object>[] flows = [
            new Dictionary<string, object> {
                { GetTokenOptions.ScopesPropertyName, new string[] { "defaultScope" } },
                { GetTokenOptions.TokenUrlPropertyName , "https://myauthserver.com/token"},
                { GetTokenOptions.RefreshUrlPropertyName, "https://myauthserver.com/refresh"}
            }
        ];

        /// <summary>
        /// Initializes a new instance of the <see cref="SampleTypeSpecClient"/> class.
        /// </summary>
        /// <param name="uri">The URI of the service.</param>
        /// <param name="authTokenProvider">The authentication token provider.</param>
        public SampleTypeSpecClient(Uri uri, AuthenticationTokenProvider authTokenProvider)
        {
            var options = new ClientPipelineOptions();
            Pipeline = ClientPipeline.Create(options,
            perCallPolicies: ReadOnlySpan<PipelinePolicy>.Empty,
            perTryPolicies: [new OAuth2BearerTokenAuthenticationPolicy(authTokenProvider, flows)],
            beforeTransportPolicies: ReadOnlySpan<PipelinePolicy>.Empty);
        }
    }
}
