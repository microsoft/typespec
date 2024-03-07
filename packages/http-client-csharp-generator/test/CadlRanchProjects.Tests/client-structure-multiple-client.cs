using System;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Client.Structure.Service.Multiple.Client;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class ClientStructureMultipleClientTests : CadlRanchTestBase
    {
        [Test]
        public void Client_Structure_mulitple_client_methods()
        {
            /*cheeck methods in ClientAClient. */
            var methodsOfClientA = typeof(ClientAClient).GetMethods();
            Assert.IsNotNull(methodsOfClientA);
            Assert.AreEqual(3, methodsOfClientA.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
            Assert.AreNotEqual(null, typeof(ClientAClient).GetMethod("RenamedOneAsync"));
            Assert.AreNotEqual(null, typeof(ClientAClient).GetMethod("RenamedThreeAsync"));
            Assert.AreNotEqual(null, typeof(ClientAClient).GetMethod("RenamedFiveAsync"));

            /*cheeck methods in ClientBClient. */
            var methodsOfClientB = typeof(ClientBClient).GetMethods();
            Assert.IsNotNull(methodsOfClientB);
            Assert.AreEqual(3, methodsOfClientB.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
            Assert.AreNotEqual(null, typeof(ClientBClient).GetMethod("RenamedTwoAsync"));
            Assert.AreNotEqual(null, typeof(ClientBClient).GetMethod("RenamedFourAsync"));
            Assert.AreNotEqual(null, typeof(ClientBClient).GetMethod("RenamedSixAsync"));
        }
        [Test]
        public Task Client_Structure_Multiple_ClientA_RenamedOne() => Test(async (host) =>
        {
            Response response = await new ClientAClient(host, "multi-client").RenamedOneAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Multiple_ClientA_RenamedThree() => Test(async (host) =>
        {
            Response response = await new ClientAClient(host, "multi-client").RenamedThreeAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Multiple_ClientA_RenamedFive() => Test(async (host) =>
        {
            Response response = await new ClientAClient(host, "multi-client").RenamedFiveAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Multiple_ClientB_RenamedTwo() => Test(async (host) =>
        {
            Response response = await new ClientBClient(host, "multi-client").RenamedTwoAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Multiple_ClientB_RenamedFour() => Test(async (host) =>
        {
            Response response = await new ClientBClient(host, "multi-client").RenamedFourAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Multiple_ClientB_RenamedSix() => Test(async (host) =>
        {
            Response response = await new ClientBClient(host, "multi-client").RenamedSixAsync();
            Assert.AreEqual(204, response.Status);
        });
    }
}
