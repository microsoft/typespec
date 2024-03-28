using System;
using System.IO;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Payload.ContentNegotiation;

namespace CadlRanchProjects.Tests
{
    public class PayloadContentNegotiationTests : CadlRanchTestBase
    {
        private string SamplePngPath = Path.Combine(CadlRanchServer.GetSpecDirectory(), "assets", "image.png");
        private string SampleJpgPath = Path.Combine(CadlRanchServer.GetSpecDirectory(), "assets", "image.jpg");

        [Test]
        public Task Payload_ContentNegotiation_SameBody() => Test(async (host) =>
        {
            var response = await new ContentNegotiationClient(host, null).GetSameBodyClient().GetAvatarAsPngAsync();
            CollectionAssert.AreEqual(File.ReadAllBytes(SamplePngPath), response.Value.ToArray());

            response = await new ContentNegotiationClient(host, null).GetSameBodyClient().GetAvatarAsJpegAsync();
            CollectionAssert.AreEqual(File.ReadAllBytes(SampleJpgPath), response.Value.ToArray());
        });

        [Test]
        public Task Payload_ContentNegotiation_DifferentBody() => Test(async (host) =>
        {
            var response1 = await new ContentNegotiationClient(host, null).GetDifferentBodyClient().GetAvatarAsPngAsync();
            CollectionAssert.AreEqual(File.ReadAllBytes(SamplePngPath), response1.Value.ToArray());

            var response2 = await new ContentNegotiationClient(host, null).GetDifferentBodyClient().GetAvatarAsJsonAsync();
            CollectionAssert.AreEqual(File.ReadAllBytes(SamplePngPath), response2.Value.Content.ToArray());
        });
    }
}
