// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using NUnit.Framework;
using Payload.MediaType;

namespace TestProjects.CadlRanch.Tests.Http.Payload.MediaType
{
    public class MediaTypeTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task SendAsText() => Test(async (host) =>
        {
            var response1 = await new MediaTypeClient(host, null).GetStringBodyClient().SendAsTextAsync("{cat}");
            Assert.AreEqual(200, response1.GetRawResponse().Status);
        });

        [CadlRanchTest]
        [Ignore("https://github.com/microsoft/typespec/issues/4208")]
        public Task GetAsText() => Test(async (host) =>
        {
            var response2 = await new MediaTypeClient(host, null).GetStringBodyClient().GetAsTextAsync();
            Assert.AreEqual("{cat}", response2.Value);
        });

        [CadlRanchTest]
        public Task SendAsJson() => Test(async (host) =>
        {
            var response3 = await new MediaTypeClient(host, null).GetStringBodyClient().SendAsJsonAsync("foo");
            Assert.AreEqual(200, response3.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetAsJson() => Test(async (host) =>
        {
            var response4 = await new MediaTypeClient(host, null).GetStringBodyClient().GetAsJsonAsync();
            Assert.AreEqual("foo", response4.Value);
        });
    }
}
