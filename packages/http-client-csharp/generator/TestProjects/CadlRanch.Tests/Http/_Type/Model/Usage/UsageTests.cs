// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type.Model.Usage;
using _Type.Model.Usage.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type.Model.Usage
{
    internal class UsageTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Input() => Test(async (host) =>
        {
            var response = await new UsageClient(host, null).InputAsync(new InputRecord("example-value"));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Output() => Test(async (host) =>
        {
            OutputRecord response = await new UsageClient(host, null).OutputAsync();
            Assert.AreEqual("example-value", response.RequiredProp);
        });

        [CadlRanchTest]
        public Task InputAndOutput() => Test(async (host) =>
        {
            InputOutputRecord response = await new UsageClient(host, null).InputAndOutputAsync(new InputOutputRecord("example-value"));
            Assert.AreEqual("example-value", response.RequiredProp);
        });
    }
}
