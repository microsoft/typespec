// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using _Type.Model.Usage;
using _Type.Model.Usage.Models;

namespace CadlRanchProjects.Tests
{
    public class TypeModelUsageTests : CadlRanchTestBase
    {
        [Test]
        public Task Type_Model_Usage_input() => Test(async (host) =>
        {
            Response response = await new UsageClient(host, null).InputAsync(new InputRecord("example-value"));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Model_Usage_output() => Test(async (host) =>
        {
            OutputRecord response = await new UsageClient(host, null).OutputAsync();
            Assert.AreEqual("example-value", response.RequiredProp);
        });

        [Test]
        public Task Type_Model_Usage_inputAndOutput() => Test(async (host) =>
        {
            InputOutputRecord response = await new UsageClient(host, null).InputAndOutputAsync(new InputOutputRecord("example-value"));
            Assert.AreEqual("example-value", response.RequiredProp);
        });
    }
}
