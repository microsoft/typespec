// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Authentication.Union;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using NUnit.Framework;
using static CadlRanchProjects.Tests.OAuth2TestHelper;

namespace CadlRanchProjects.Tests
{
    public class AuthenticationUnionTests : CadlRanchTestBase
    {
        [Test]
        public Task Authentication_Union_validKey() => Test(async (host) =>
        {
            Response response = await new UnionClient(host, new AzureKeyCredential("valid-key"), null).ValidKeyAsync();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Authentication_Union_validToken() => Test(async (host) =>
        {
            var options = new UnionClientOptions();
            options.AddPolicy(new MockBearerTokenAuthenticationPolicy(new MockCredential(), UnionClient.TokenScopes, options.Transport), HttpPipelinePosition.PerCall);
            Response response = await new UnionClient(host, new MockCredential(), options).ValidTokenAsync();
            Assert.AreEqual(204, response.Status);
        });
    }
}
