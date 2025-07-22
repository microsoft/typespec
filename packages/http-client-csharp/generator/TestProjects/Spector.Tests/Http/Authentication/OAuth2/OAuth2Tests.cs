// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System.Threading.Tasks;
using Authentication.OAuth2;
using System.ClientModel;
using static TestProjects.Spector.Tests.Http.Authentication.OAuth2.OAuth2TestHelper;
using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace TestProjects.Spector.Tests.Http.Authentication.Oauth2
{
    public class OAuthTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Valid() => Test(async (host) =>
        {
            var options = new OAuth2ClientOptions();
            options.Transport = new HttpClientPipelineTransport();

            // create a test client to access the private field "_flows". This will be used to pass to the test token provider.
            var tokenProvider = new ClientCredentialTokenProvider("myClientId", "myClientSecret");
            var testClient = new OAuth2Client(tokenProvider);
            var flowsField = testClient.GetType().GetField("_flows", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(flowsField, "Flows field should not be null");
            Assert.IsInstanceOf<Dictionary<string, object>[]>(flowsField!.GetValue(testClient), "Flows field should be of type Dictionary<string, object>[]");

            // Retrieve the value of the field and cast it to the expected type.
            var flows = flowsField!.GetValue(testClient) as Dictionary<string, object>[];
            Assert.IsNotNull(flows, "Flows field should be of type Dictionary<string, object>[]");

            // Parse the generated scope to use in the test.
            string? scope = null;
            foreach (var flow in flows!)
            {
                if (flow.TryGetValue(GetTokenOptions.ScopesPropertyName, out var scopesObj) && scopesObj is string[] scopes)
                {
                    scope = scopes[0];
                    Assert.IsNotNull(scope, "Scope should not be null");
                }
                else
                {
                    Assert.Fail("Scopes property not found or not of type string[]");
                }
            }

            // Create a new token provider with the retrieved scope.
            tokenProvider = new ClientCredentialTokenProvider("myClientId", "myClientSecret", scope!);
            options.AddPolicy(new MockBearerTokenAuthenticationPolicy(tokenProvider, flows, options.Transport), PipelinePosition.PerCall);

            var response = await new OAuth2Client(host, tokenProvider, options).ValidAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task Invalid() => Test((host) =>
        {
            var options = new OAuth2ClientOptions();
            options.Transport = new HttpClientPipelineTransport();

            // create a test client to access the private field "_flows". This will be used to pass to the test token provider.
            var tokenProvider = new ClientCredentialTokenProvider("myClientId", "myClientSecret");
            var testClient = new OAuth2Client(tokenProvider);
            var flowsField = testClient.GetType().GetField("_flows", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(flowsField, "Flows field should not be null");
            Assert.IsInstanceOf<Dictionary<string, object>[]>(flowsField!.GetValue(testClient), "Flows field should be of type Dictionary<string, object>[]");

            // Retrieve the value of the field and cast it to the expected type.
            var flows = flowsField!.GetValue(testClient) as Dictionary<string, object>[];
            Assert.IsNotNull(flows, "Flows field should be of type Dictionary<string, object>[]");

            // Parse the generated scope to use in the test.
            string? scope = null;
            foreach (var flow in flows!)
            {
                if (flow.TryGetValue(GetTokenOptions.ScopesPropertyName, out var scopesObj) && scopesObj is string[] scopes)
                {
                    scope = scopes[0];
                    Assert.IsNotNull(scope, "Scope should not be null");
                }
                else
                {
                    Assert.Fail("Scopes property not found or not of type string[]");
                }
            }

            // Create a new token provider with the retrieved scope.
            tokenProvider = new ClientCredentialTokenProvider("myClientId", "myClientSecret", scope!);
            options.AddPolicy(new MockBearerTokenAuthenticationPolicy(tokenProvider, flows, options.Transport), PipelinePosition.PerCall);

            var exception = Assert.ThrowsAsync<ClientResultException>(() => new OAuth2Client(host, tokenProvider, options).InvalidAsync());
            Assert.AreEqual(403, exception?.Status);
            return Task.CompletedTask;
        });
    }
}
