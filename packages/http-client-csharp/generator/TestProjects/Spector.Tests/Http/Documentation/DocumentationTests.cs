// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using Documentation;
using Documentation._Lists;
using Documentation._TextFormatting;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.Documentation
{
    public class DocumentationTests : SpectorTestBase
    {
        // Lists namespace tests
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

        // TextFormatting namespace tests
        [SpectorTest]
        public Task BoldText() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().BoldTextAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task ItalicText() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().ItalicTextAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task CombinedFormatting() => Test(async (host) =>
        {
            var client = new DocumentationClient(host, new DocumentationClientOptions());
            var response = await client.GetTextFormattingClient().CombinedFormattingAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
