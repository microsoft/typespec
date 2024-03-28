using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Server.Path.Single;
using System.Threading.Tasks;

namespace CadlRanchProjects.Tests
{
    public class ServerPathSingleTests : CadlRanchTestBase
    {
        [Test]
        public Task Server_Path_Single_myOp() => Test(async (host) =>
        {
            var response = await new SingleClient(host, null).MyOpAsync();
            Assert.AreEqual(200, response.Status);
        });
    }
}
