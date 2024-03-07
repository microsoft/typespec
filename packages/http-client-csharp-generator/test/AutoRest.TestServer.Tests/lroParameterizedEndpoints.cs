// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using lro_parameterized_endpoints;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class lroParameterizedEndpoints: TestServerTestBase
    {
        [Test]
        public Task LROParameterizedEndpoint() => Test(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var operation = await new LROWithParamaterizedEndpointsClient(ClientDiagnostics, pipeline, "host:" + host.Port).StartPollWithParameterizedEndpointsAsync("local");
            var result = await operation.WaitForCompletionAsync();

            Assert.AreEqual("success", result.Value);
        });

    }
}
