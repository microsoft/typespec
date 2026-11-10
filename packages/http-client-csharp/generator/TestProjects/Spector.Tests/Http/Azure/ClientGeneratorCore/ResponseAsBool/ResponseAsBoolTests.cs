// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using NUnit.Framework;
using Specs.Azure.ClientGenerator.Core.ResponseAsBool;

namespace TestProjects.Spector.Tests.Http.Azure.ClientGeneratorCore.ResponseAsBool
{
    public class ResponseAsBoolTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Exists() => Test(async (host) =>
        {
            var response = await new ResponseAsBoolClient(host, null).GetHeadAsBooleanClient().ExistsAsync();
            Assert.IsTrue(response.Value);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task NotExists() => Test(async (host) =>
        {
            var response = await new ResponseAsBoolClient(host, null).GetHeadAsBooleanClient().NotExistsAsync();
            Assert.IsFalse(response.Value);
            Assert.AreEqual(404, response.GetRawResponse().Status);
        });
    }
}
