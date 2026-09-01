// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using NUnit.Framework;
using Payload.Head;

namespace TestProjects.Spector.Tests.Http.Payload.Head
{
    public class HeadTests : SpectorTestBase
    {
        [SpectorTest]
        public Task ContentTypeHeaderInResponse() => Test(async (host) =>
        {
            var response = await new HeadClient(host, null).ContentTypeHeaderInResponseAsync();
            var rawResponse = response.GetRawResponse();
            Assert.AreEqual(200, rawResponse.Status);
            Assert.IsTrue(rawResponse.Headers.TryGetValue("Content-Type", out string? contentType));
            Assert.AreEqual("text/plain; charset=utf-8", contentType);
            Assert.IsTrue(rawResponse.Headers.TryGetValue("x-ms-meta", out string? metadata));
            Assert.AreEqual("hello", metadata);
        });
    }
}
