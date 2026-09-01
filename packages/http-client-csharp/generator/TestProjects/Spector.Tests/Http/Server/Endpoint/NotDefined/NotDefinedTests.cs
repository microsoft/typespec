// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using NUnit.Framework;
using Server.Endpoint.NotDefined;

namespace TestProjects.Spector.Tests.Http.Server.Endpoint.NotDefined
{
    public class NotDefinedTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Valid() => Test(async (host) =>
        {
            var response = await new NotDefinedClient(host, null).ValidAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });
    }
}
