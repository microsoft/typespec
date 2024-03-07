using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Server.Path.Multiple;

namespace CadlRanchProjects.Tests
{
    public class ServerPathMultipleTests : CadlRanchTestBase
    {
        [Test]
        public Task Server_Path_Multiple_noOperationParams() => Test(async (host) =>
        {
            var response = await new MultipleClient(host, null).NoOperationParamsAsync();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Server_Path_Multiple_withOperationPathParam() => Test(async (host) =>
        {
            var response = await new MultipleClient(host, null).WithOperationPathParamAsync("test");
            Assert.AreEqual(204, response.Status);
        });
    }
}
