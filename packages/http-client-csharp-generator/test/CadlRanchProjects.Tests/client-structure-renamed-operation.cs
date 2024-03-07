using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Client.Structure.Service.rename.operation;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class ClientStructureRenamedOperationTests : CadlRanchTestBase
    {
        [Test]
        public void Client_Structure_Renamed_Operation_methods()
        {
            /*check methods in service client. */
            var methodsOfServiceClient = typeof(RenamedOperationClient).GetMethods();
            Assert.IsNotNull(methodsOfServiceClient);
            Assert.AreEqual(3, methodsOfServiceClient.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
            Assert.AreNotEqual(null, typeof(RenamedOperationClient).GetMethod("RenamedOneAsync"));
            Assert.AreNotEqual(null, typeof(RenamedOperationClient).GetMethod("RenamedThreeAsync"));
            Assert.AreNotEqual(null, typeof(RenamedOperationClient).GetMethod("RenamedFiveAsync"));
            //check existance of method to get the operation group client
            Assert.AreNotEqual(null, typeof(RenamedOperationClient).GetMethod("GetGroupClient"));

            /*check methods in operation client. */
            var methodsOfOperationGroup = typeof(Group).GetMethods();
            Assert.IsNotNull(methodsOfOperationGroup);
            Assert.AreEqual(3, methodsOfOperationGroup.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
            Assert.AreNotEqual(null, typeof(Group).GetMethod("RenamedTwoAsync"));
            Assert.AreNotEqual(null, typeof(Group).GetMethod("RenamedFourAsync"));
            Assert.AreNotEqual(null, typeof(Group).GetMethod("RenamedSixAsync"));
        }
        [Test]
        public Task Client_Structure_Service_Client_RenamedOne() => Test(async (host) =>
        {
            Response response = await new RenamedOperationClient(host, "renamed-operation").RenamedOneAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Service_Client_RenamedThree() => Test(async (host) =>
        {
            Response response = await new RenamedOperationClient(host, "renamed-operation").RenamedThreeAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Service_Client_RenamedFive() => Test(async (host) =>
        {
            Response response = await new RenamedOperationClient(host, "renamed-operation").RenamedFiveAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group_Client_RenamedTwo() => Test(async (host) =>
        {
            Response response = await new RenamedOperationClient(host, "renamed-operation").GetGroupClient().RenamedTwoAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group_Client_RenamedFour() => Test(async (host) =>
        {
            Response response = await new RenamedOperationClient(host, "renamed-operation").GetGroupClient().RenamedFourAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group_Client_RenamedSix() => Test(async (host) =>
        {
            Response response = await new RenamedOperationClient(host, "renamed-operation").GetGroupClient().RenamedSixAsync();
            Assert.AreEqual(204, response.Status);
        });
    }
}
