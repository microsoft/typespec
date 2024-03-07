using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Server.Versions.Versioned;

namespace CadlRanchProjects.Tests
{
    public class ServerVersionsVersionedTests : CadlRanchTestBase
    {
        [Test]
        public Task Server_Versions_Versioned_withoutApiVersion() => Test(async (host) =>
        {
            var response = await new VersionedClient(host, null).WithoutApiVersionAsync();
            Assert.AreEqual(200, response.Status);
        });

        [Test]
        public Task Server_Versions_Versioned_withQueryApiVersion() => Test(async (host) =>
        {
            var response = await new VersionedClient(host, null).WithQueryApiVersionAsync();
            Assert.AreEqual(200, response.Status);
        });

        [Test]
        public Task Server_Versions_Versioned_withPathApiVersion() => Test(async (host) =>
        {
            var response = await new VersionedClient(host, null).WithPathApiVersionAsync();
            Assert.AreEqual(200, response.Status);
        });
    }
}
