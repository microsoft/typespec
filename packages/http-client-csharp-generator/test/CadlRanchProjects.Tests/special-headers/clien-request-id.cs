using _Specs_.Azure.Core.Traits;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using System.Threading.Tasks;
using SpecialHeaders.ClientRequestId;

namespace CadlRanchProjects.Tests
{
    public class ClientRequestIDHeaderTests : CadlRanchTestBase
    {
        [Test]
        public Task Special_Headers_Client_Request_ID_Get() => Test(async (host) =>
        {
            Response response = await new ClientRequestIdClient(host, null).GetClientRequestIdAsync();
            Assert.AreEqual(204, response.Status);
            Assert.IsTrue(response.Headers.TryGetValue("client-request-id", out var headerValue));
        });
    }
}
