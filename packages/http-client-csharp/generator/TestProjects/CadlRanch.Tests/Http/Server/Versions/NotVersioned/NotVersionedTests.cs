using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Server.Versions.NotVersioned;

namespace TestProjects.CadlRanch.Tests.Http.Server.Versions.NotVersioned
{
    public class NotVersionedTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task WithoutApiVersion() => Test(async (host) =>
        {
            var response = await new NotVersionedClient(host, null).WithoutApiVersionAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task WithQueryApiVersion() => Test(async (host) =>
        {
            var response = await new NotVersionedClient(host, null).WithQueryApiVersionAsync("v1.0");
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task WithPathApiVersion() => Test(async (host) =>
        {
            var response = await new NotVersionedClient(host, null).WithPathApiVersionAsync("v1.0");
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });
    }
}
