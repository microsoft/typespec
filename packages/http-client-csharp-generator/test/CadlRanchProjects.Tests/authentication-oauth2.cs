// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using Authentication.OAuth2;
using Azure.Core;
using NUnit.Framework.Internal;
using static CadlRanchProjects.Tests.OAuth2TestHelper;

namespace CadlRanchProjects.Tests
{
    public class AuthenticationOAuth2Tests: CadlRanchTestBase
    {
        [Test]
        public Task Authentication_OAuth2_valid() => Test(async (host) =>
        {
            var options = new OAuth2ClientOptions();
            options.AddPolicy(new MockBearerTokenAuthenticationPolicy(new MockCredential(), OAuth2Client.TokenScopes, options.Transport), HttpPipelinePosition.PerCall);
            Response response = await new OAuth2Client(host, new MockCredential(), options).ValidAsync();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Authentication_OAuth2_invalid() => Test((host) =>
        {
            var options = new OAuth2ClientOptions();
            options.AddPolicy(new MockBearerTokenAuthenticationPolicy(new MockCredential(), OAuth2Client.TokenScopes, options.Transport), HttpPipelinePosition.PerCall);

            var exception = Assert.ThrowsAsync<RequestFailedException>(() => new OAuth2Client(host, new MockCredential(), options).InvalidAsync());
            Assert.AreEqual(403, exception.Status);
            return Task.CompletedTask;
        });
    }
}
