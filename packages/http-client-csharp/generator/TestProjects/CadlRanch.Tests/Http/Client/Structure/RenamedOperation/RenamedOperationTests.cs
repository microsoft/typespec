// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Client.Structure.Service;
using Client.Structure.Service.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http.Client.Structure.RenamedOperation
{
    public class RenamedOperationTests : CadlRanchTestBase
    {
        [Test]
        public void VerifyMethods()
        {
            /*cheeck methods in RenamedOperationClient. */
            var methodsRenamedOperation = typeof(RenamedOperationClient).GetMethods();
            Assert.IsNotNull(methodsRenamedOperation);
            Assert.AreEqual(3, methodsRenamedOperation.Where(method => method.Name.EndsWith("Async")).Count());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "RenamedOneAsync").FirstOrDefault());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "RenamedThreeAsync").FirstOrDefault());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "RenamedFiveAsync").FirstOrDefault());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "GetGroupClient").FirstOrDefault());
        }

        [CadlRanchTest]
        public Task RenamedOne() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperationClient, null).RenamedOneAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedThree() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperationClient, null).RenamedThreeAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedFive() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperationClient, null).RenamedFiveAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        // Check OperationGroup
        [CadlRanchTest]
        public Task RenamedTwo() => Test(async (host) =>
        {
            var response = await new ClientBClient(host, ClientType.RenamedOperationClient.Group, null).RenamedTwoAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedFour() => Test(async (host) =>
        {
            var response = await new ClientBClient(host, ClientType.RenamedOperationClient, null).RenamedFourAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedSix() => Test(async (host) =>
        {
            var response = await new ClientBClient(host, ClientType.RenamedOperationClient, null).RenamedSixAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
