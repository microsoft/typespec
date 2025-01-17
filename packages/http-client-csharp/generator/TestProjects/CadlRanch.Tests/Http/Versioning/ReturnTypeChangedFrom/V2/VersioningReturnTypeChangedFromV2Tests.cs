// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

extern alias ReturnTypeChangedFromV2;
using System.Threading.Tasks;
using NUnit.Framework;
using ReturnTypeChangedFromV2::Versioning.ReturnTypeChangedFrom;

namespace TestProjects.CadlRanch.Tests.Http.Versioning.ReturnTypeChangedFrom.V2
{
    public class VersioningReturnTypeChangedFromTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Versioning_ReturnTypeChangedFrom_Test() => Test(async (host) =>
        {
            var response = await new ReturnTypeChangedFromClient(host).TestAsync("test");
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("test", response.Value);
        });
    }
}
