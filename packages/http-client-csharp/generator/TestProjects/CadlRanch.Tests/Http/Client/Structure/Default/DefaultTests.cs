// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Client.Structure.Service.Default;
using Client.Structure.Service.Default.Models;
using Client.Structure.Service.Renamed.Operation;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http.Client.Structure.Default
{
    public class DefaultTests : CadlRanchTestBase
    {
        [TestCase(typeof(ServiceClient), new string[] { "One", "Two" })]
        [TestCase(typeof(Foo), new string[] { "Three", "Four" })]
        [TestCase(typeof(Bar), new string[] { "Five", "Six" })]
        [TestCase(typeof(BazFoo), new string[] { "Seven" })]
        [TestCase(typeof(Qux), new string[] { "Eight" })]
        [TestCase(typeof(QuxBar), new string[] { "Nine" })]

        public void Client_Structure_default_methods(Type client, string[] methodNames)
        {
            var methods = client.GetMethods();
            Assert.IsNotNull(methods);
            Assert.AreEqual(methodNames.Length * 2, methods.Where(method => method.Name.EndsWith("Async")).ToArray().Length); // Double the methods to account for protocol methods
            /* check the existence of the methods. */
            foreach (var methodName in methodNames)
            {
                Assert.IsNotNull(methods.Where(m => m.Name == $"{methodName}Async").FirstOrDefault());
            }
        }

        [CadlRanchTest]
        public Task Client_Structure_default_One() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).OneAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Two() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).TwoAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Three() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).GetFooClient().ThreeAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Four() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).GetFooClient().FourAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Five() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).GetBarClient().FiveAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Six() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).GetBarClient().SixAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Seven() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).GetBazClient().GetBazFooClient().SevenAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Eight() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).GetQuxClient().EightAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Client_Structure_default_Nine() => Test(async (host) =>
        {
            var response = await new ServiceClient(host, ClientType.Default).GetQuxClient().GetQuxBarClient().NineAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
