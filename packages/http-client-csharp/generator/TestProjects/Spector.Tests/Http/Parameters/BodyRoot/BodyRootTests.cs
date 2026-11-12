// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using NUnit.Framework;
using Parameters.BodyRoot;

namespace TestProjects.Spector.Tests.Http.Parameters.BodyRoot
{
    public class BodyRootTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Nested() => Test(async (host) =>
        {
            var bodyRoot = new BodyRootModel
            {
                Category = "widget",
                LinkType = "hard",
                WasSuccessful = true
            };
            var response = await new BodyRootClient(host, null).NestedAsync(new NestedParameterBody(bodyRoot));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
