// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Authentication.ApiKey;
using Authentication.Http.Custom;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using System.Threading.Tasks;

namespace CadlRanchProjects.Tests
{
    public class AuthenticationHTTPCustomTests : CadlRanchTestBase
    {
        [Test]
        public Task Authentication_Http_Custom_valid() => Test(async (host) =>
        {
            Response response = await new CustomClient(host, new AzureKeyCredential("valid-key"), null).ValidAsync();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Authentication_Http_Custom_invalid() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(() => new CustomClient(host, new AzureKeyCredential("invalid-api-key"), null).InvalidAsync());
            Assert.AreEqual(403, exception.Status);
            return Task.CompletedTask;
        });
    }
}
