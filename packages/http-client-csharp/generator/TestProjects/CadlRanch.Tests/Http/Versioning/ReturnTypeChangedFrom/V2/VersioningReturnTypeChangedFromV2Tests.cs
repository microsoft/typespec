// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using NUnit.Framework;
using Versioning.ReturnTypeChangedFrom.V2;

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
