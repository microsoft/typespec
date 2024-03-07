using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Server.Versions.NotVersioned;

namespace CadlRanchProjects.Tests
{
    public class ServerVersionsNotVersionedTests : CadlRanchTestBase
    {
        [Test]
        public Task Server_Versions_NotVersioned_withoutApiVersion() => Test(async (host) =>
        {
            var response = await new NotVersionedClient(host, null).WithoutApiVersionAsync();
            Assert.AreEqual(200, response.Status);
        });

        [Test]
        public Task Server_Versions_NotVersioned_withQueryApiVersion() => Test(async (host) =>
        {
            var response = await new NotVersionedClient(host, null).WithQueryApiVersionAsync("v1.0");
            Assert.AreEqual(200, response.Status);
        });

        [Test]
        public Task Server_Versions_NotVersioned_withPathApiVersion() => Test(async (host) =>
        {
            var response = await new NotVersionedClient(host, null).WithPathApiVersionAsync("v1.0");
            Assert.AreEqual(200, response.Status);
        });
    }
}
