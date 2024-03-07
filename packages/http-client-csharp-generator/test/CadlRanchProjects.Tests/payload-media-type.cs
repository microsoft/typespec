using System;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Payload.MediaType;

namespace CadlRanchProjects.Tests
{
    public class PayloadMediaTypeTests : CadlRanchTestBase
    {
        [Test]
        public Task Payload_MediaType_StringBody_sendAsText() => Test(async (host) =>
        {
            var response1 = await new MediaTypeClient(host, null).GetStringBodyClient().SendAsTextAsync("{cat}");
            Assert.AreEqual(200, response1.Status);
        });

        [Test]
        public Task Payload_MediaType_StringBody_getAsText() => Test(async (host) =>
        {
            var response2 = await new MediaTypeClient(host, null).GetStringBodyClient().GetAsTextAsync();
            Assert.AreEqual("{cat}", response2.Value);
        });

        [Test]
        public Task Payload_MediaType_StringBody_sendAsJson() => Test(async (host) =>
        {
            var response3 = await new MediaTypeClient(host, null).GetStringBodyClient().SendAsJsonAsync("foo");
            Assert.AreEqual(200, response3.Status);
        });

        [Test]
        public Task Payload_MediaType_StringBody_getAsJson() => Test(async (host) =>
        {
            var response4 = await new MediaTypeClient(host, null).GetStringBodyClient().GetAsJsonAsync();
            Assert.AreEqual("foo", response4.Value);
        });
    }
}
