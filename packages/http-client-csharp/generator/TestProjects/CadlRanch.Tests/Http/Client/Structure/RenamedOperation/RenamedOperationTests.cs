// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Client.Structure.Service.renamed.operation;
using Client.Structure.Service.renamed.operation.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http.Client.Structure.RenamedOperation
{
    public class RenamedOperationTests : CadlRanchTestBase
    {
        [Test]
        public void VerifyMethods()
        {
            /*check methods in RenamedOperationClient. */
            var methodsRenamedOperation = typeof(RenamedOperationClient).GetMethods();
            Assert.IsNotNull(methodsRenamedOperation);
            Assert.AreEqual(6, methodsRenamedOperation.Where(method => method.Name.EndsWith("Async")).Count());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "RenamedOneAsync").FirstOrDefault());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "RenamedThreeAsync").FirstOrDefault());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "RenamedFiveAsync").FirstOrDefault());
            Assert.IsNotNull(typeof(RenamedOperationClient).GetMethods().Where(m => m.Name == "GetGroupClient").FirstOrDefault());
        }

        [CadlRanchTest]
        public Task RenamedOne() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperation, null).RenamedOneAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedThree() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperation, null).RenamedThreeAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedFive() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperation, null).RenamedFiveAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        // Check OperationGroup
        [CadlRanchTest]
        public Task RenamedTwo() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperation, null).GetGroupClient().RenamedTwoAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedFour() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperation, null).GetGroupClient().RenamedFourAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task RenamedSix() => Test(async (host) =>
        {
            var response = await new RenamedOperationClient(host, ClientType.RenamedOperation, null).GetGroupClient().RenamedSixAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
