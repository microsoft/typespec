// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System.Threading.Tasks;
using Versioning.TypeChangedFrom.V2;
using Versioning.TypeChangedFrom.V2.Models;

namespace TestProjects.CadlRanch.Tests.Http.Versioning.TypeChangedFrom.V2
{
    public class VersioningTypeChangedFromTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Versioning_TypeChangedFrom_Test() => Test(async (host) =>
        {
            TestModel body = new TestModel("foo", "bar");
            var response = await new TypeChangedFromClient(host).TestAsync("baz", body);
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.Prop);
            Assert.AreEqual("bar", response.Value.ChangedProp);
        });
    }
}
