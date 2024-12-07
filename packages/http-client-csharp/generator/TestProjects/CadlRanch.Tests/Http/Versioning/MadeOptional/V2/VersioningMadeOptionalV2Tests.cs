// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System.Linq;
using System.Threading.Tasks;
using Versioning.MadeOptional.V2;
using Versioning.MadeOptional.V2.Models;

namespace TestProjects.CadlRanch.Tests.Http.Versioning.MadeOptional.V2
{
    public class VersioningMadeOptionalV2Tests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public void CheckMadeOptionalMembers()
        {
            var constructors = typeof(TestModel).GetConstructors();
            Assert.IsNotNull(constructors);
            Assert.AreEqual(1, constructors.Length);
            /* optional property will not show in public constructor signature. */
            Assert.False(constructors[0].GetParameters().Any(p => p.Name == "changedProp"));
        }

        [CadlRanchTest]
        public Task Versioning_MadeOptional_Test() => Test(async (host) =>
        {
            TestModel body = new TestModel("foo");
            var response = await new MadeOptionalClient(host).TestAsync(body);
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.Prop);
        });
    }
}
