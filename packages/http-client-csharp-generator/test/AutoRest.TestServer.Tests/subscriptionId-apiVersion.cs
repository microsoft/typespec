// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using subscriptionId_apiVersion;

namespace AutoRest.TestServer.Tests
{
    public class SubscriptionIdApiVersionTest: TestServerTestBase
    {
        [Test]
        public Task SubscriptionIdAndApiVersion() => Test(async (host, pipeline) =>
        {
            var result = await new GroupClient(ClientDiagnostics, pipeline, "sub", host, "2014-04-01-preview").GetSampleResourceGroupAsync("testgroup101");
            Assert.AreEqual("West US", result.Value.Location);
            Assert.AreEqual("testgroup101", result.Value.Name);
        });

    }
}
