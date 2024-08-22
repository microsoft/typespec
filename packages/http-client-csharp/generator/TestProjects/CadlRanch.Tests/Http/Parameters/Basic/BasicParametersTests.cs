// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Threading.Tasks;
using NUnit.Framework;
using Parameters.Basic;
using Parameters.Basic.Models;

namespace TestProjects.CadlRanch.Tests.Http.Parameters.Basic
{
    public class BasicParametersTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task ExplicitBodySimple() => Test(async (host) =>
        {
            var client = new BasicClient(host, null).GetExplicitBodyClient();
            var body = new User("foo");
            ClientResult response = await client.SimpleAsync(body);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task ImplicitBodySimple() => Test(async (host) =>
        {
            var client = new BasicClient(host, null).GetImplicitBodyClient();
            var name = "foo";
            ClientResult response = await client.SimpleAsync(name);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
