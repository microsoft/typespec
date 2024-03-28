using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using System.Threading.Tasks;
using SpecialHeaders.ConditionalRequest;

namespace CadlRanchProjects.Tests
{
    public class ConditionalRequestHeaderTests : CadlRanchTestBase
    {
        [Test]
        public Task Special_Headers_Conditional_Request_PostIfMatch() => Test(async (host) =>
        {
            ETag ifMatch = new ETag("valid");
            Response response = await new ConditionalRequestClient(host, null).PostIfMatchAsync(ifMatch);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Special_Headers_Conditional_Request_PostIfNoneMatch() => Test(async (host) =>
        {
            ETag ifNoneMatch = new ETag("invalid");
            Response response = await new ConditionalRequestClient(host, null).PostIfNoneMatchAsync(ifNoneMatch);
            Assert.AreEqual(204, response.Status);
        });
    }
}
