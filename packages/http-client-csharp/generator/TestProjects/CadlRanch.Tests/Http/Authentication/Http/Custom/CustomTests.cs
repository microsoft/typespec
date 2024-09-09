// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Threading.Tasks;
using Authentication.Http.Custom;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http.Authentication.Http.Custom
{
    internal class CustomTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Valid() => Test(async (host) =>
        {
            ClientResult result = await new CustomClient(host, new ApiKeyCredential("valid-key"), null).ValidAsync();
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Invalid() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<ClientResultException>(() => new CustomClient(host, new ApiKeyCredential("invalid-api-key"), null).InvalidAsync());
            Assert.AreEqual(403, exception!.Status);
            return Task.CompletedTask;
        });
    }
}
