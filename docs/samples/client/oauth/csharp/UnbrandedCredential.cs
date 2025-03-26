// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Azure.Core;
using Azure.Core.TestFramework;
using Azure.Identity;
using Azure.Core.Experimental.Models;
using NUnit.Framework;

namespace UnbrandedCredential
{
    public class UnbrandedCredentialSamples : SamplesBase<MonitorQueryTestEnvironment>
    {
        [Test]
        public async Task UnbrandedApiKeyCredential()
        {
            #region Snippet:CreateClientWithApiKeyCredential
            public FooClient(Uri uri, ApiKeyCredential credential)
            {
                var options = new ClientPipelineOptions();
                options.Transport = new MockPipelineTransport("foo", m => new MockPipelineResponse(200));
                ClientPipeline pipeline = ClientPipeline.Create(options,
                perCallPolicies: ReadOnlySpan<PipelinePolicy>.Empty,
                perTryPolicies: [ApiKeyAuthenticationPolicy.CreateBasicAuthorizationPolicy(credential)],
                beforeTransportPolicies: ReadOnlySpan<PipelinePolicy>.Empty);
                _pipeline = pipeline;
            }
            #endregion
        }

        [Test]
        public async Task UnbrandedAuthenticationTokenProvider()
        {
            #region Snippet:CreateClientWithAuthenticationTokenProvider
            // Generated from the TypeSpec spec for use in FooClient
            private readonly Dictionary<string, object>[] flows = [
                new Dictionary<string, object> {
                    { GetTokenOptions.ScopesPropertyName, new string[] { "baselineScope" } },
                    { GetTokenOptions.TokenUrlPropertyName , "https://myauthserver.com/token"},
                    { GetTokenOptions.RefreshUrlPropertyName, "https://myauthserver.com/refresh"}
                }
            ];

            public FooClient(Uri uri, AuthenticationTokenProvider credential)
            {
                var options = new ClientPipelineOptions();
                options.Transport = new MockPipelineTransport("foo",
                m =>
                {
                    return new MockPipelineResponse(200);
                });
                ClientPipeline pipeline = ClientPipeline.Create(options,
                perCallPolicies: ReadOnlySpan<PipelinePolicy>.Empty,
                perTryPolicies: [new OAuth2BearerTokenAuthenticationPolicy(credential, flows)],
                beforeTransportPolicies: ReadOnlySpan<PipelinePolicy>.Empty);
                _pipeline = pipeline;
            }
            #endregion
        }
    }
}
