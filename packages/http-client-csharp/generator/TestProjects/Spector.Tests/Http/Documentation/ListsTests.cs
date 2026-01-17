// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Documentation;
using Documentation._Lists;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.Documentation
{
    public class ListsTests : SpectorTestBase
    {
        [SpectorTest]
        public Task BulletPointsOp() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetListsClient().BulletPointsOpAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("https://github.com/microsoft/typespec/issues/9173")]
        public Task BulletPointsModel() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var input = new BulletPointsModel(BulletPointsEnum.Simple);
            var response = await client.GetListsClient().BulletPointsModelAsync(input);
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task Numbered() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetListsClient().NumberedAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
