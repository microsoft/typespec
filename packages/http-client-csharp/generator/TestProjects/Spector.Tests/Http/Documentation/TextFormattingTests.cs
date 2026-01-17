// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Documentation;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.Documentation
{
    public class TextFormattingTests : SpectorTestBase
    {
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
