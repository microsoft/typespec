// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using Server.Endpoint.NotDefined;
using System.Threading.Tasks;

namespace TestProjects.CadlRanch.Tests.Http.Server.Endpoint.NotDefined
{
    public class NotDefinedTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Valid() => Test(async (host) =>
        {
            var response = await new NotDefinedClient(host, null).ValidAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });
    }
}
