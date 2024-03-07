using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Server.Path.SingleHeadAsBoolean;
using System.Threading.Tasks;

namespace CadlRanchProjects.Tests
{
    public class ServerPathSingleHeadAsBooleanTests : CadlRanchTestBase
    {
        [Test]
        public Task Server_Path_Single_HeadAsBoolean_myOp() => Test(async (host) =>
        {
            var response = await new SingleClient(host, null).MyOpAsync();
            Assert.AreEqual(true, response.Value);
        });
    }
}
