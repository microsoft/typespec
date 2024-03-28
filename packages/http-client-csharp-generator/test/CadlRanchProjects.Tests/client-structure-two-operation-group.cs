using System;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Client.Structure.Service.TwoOperationGroup;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class ClientStructureTwoOperationGroupTests : CadlRanchTestBase
    {
        [Test]
        public void Client_Structure_Two_Operation_Group_methods()
        {
            /* check the methods in service client. */
            var methodsOfServiceClient = typeof(TwoOperationGroupClient).GetMethods();
            Assert.IsNotNull(methodsOfServiceClient);
            Assert.AreEqual(0, methodsOfServiceClient.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
            //check existance of method to get the operation group client
            Assert.AreNotEqual(null, typeof(TwoOperationGroupClient).GetMethod("GetGroup1Client"));
            Assert.AreNotEqual(null, typeof(TwoOperationGroupClient).GetMethod("GetGroup2Client"));

            /*cheeck methods in operation group1 client. */
            var methodsOfGroup1 = typeof(Group1).GetMethods();
            Assert.IsNotNull(methodsOfGroup1);
            Assert.AreEqual(3, methodsOfGroup1.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
            Assert.AreNotEqual(null, typeof(Group1).GetMethod("OneAsync"));
            Assert.AreNotEqual(null, typeof(Group1).GetMethod("ThreeAsync"));
            Assert.AreNotEqual(null, typeof(Group1).GetMethod("FourAsync"));

            /*cheeck methods in operation group2 client. */
            var methodsOfGroup2 = typeof(Group2).GetMethods();
            Assert.IsNotNull(methodsOfGroup2);
            Assert.AreEqual(3, methodsOfGroup2.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
            Assert.AreNotEqual(null, typeof(Group2).GetMethod("TwoAsync"));
            Assert.AreNotEqual(null, typeof(Group2).GetMethod("FiveAsync"));
            Assert.AreNotEqual(null, typeof(Group2).GetMethod("SixAsync"));
        }
        [Test]
        public Task Client_Structure_Operation_Group1_Client_One() => Test(async (host) =>
        {
            Response response = await new TwoOperationGroupClient(host).GetGroup1Client("two-operation-group").OneAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group1_Client_Three() => Test(async (host) =>
        {
            Response response = await new TwoOperationGroupClient(host).GetGroup1Client("two-operation-group").ThreeAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group1_Client_Four() => Test(async (host) =>
        {
            Response response = await new TwoOperationGroupClient(host).GetGroup1Client("two-operation-group").FourAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group2_Client_Two() => Test(async (host) =>
        {
            Response response = await new TwoOperationGroupClient(host).GetGroup2Client("two-operation-group").TwoAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group2_Client_Five() => Test(async (host) =>
        {
            Response response = await new TwoOperationGroupClient(host).GetGroup2Client("two-operation-group").FiveAsync();
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Client_Structure_Operation_Group2_Client_Six() => Test(async (host) =>
        {
            Response response = await new TwoOperationGroupClient(host).GetGroup2Client("two-operation-group").SixAsync();
            Assert.AreEqual(204, response.Status);
        });
    }
}
