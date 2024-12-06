// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using NUnit.Framework;
using Versioning.Removed.V1;
using Versioning.Removed.V1.Models;

namespace TestProjects.CadlRanch.Tests.Http.Versioning.Removed.V1
{
    public class VersioningRemovedV1Tests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public void TestRemovedMembers()
        {
            /* check existence of the removed model ModelV1. */
            Assert.IsNotNull(Type.GetType("Versioning.Removed.V1.Models.ModelV1"));

            /* check existence of the removed enum EnumV1. */
            Assert.IsNotNull(Type.GetType("Versioning.Removed.V1.Models.EnumV1"));

            /* check existence of removed method V1 */
            var removedMethods = typeof(RemovedClient).GetMethods().Where(m => m.Name == "V1" || m.Name == "V1Async");
            Assert.AreEqual(4, removedMethods.Count());

            /* check existence of removed parameter. */
            var v2Methods = typeof(RemovedClient).GetMethods().Where(m => m.Name == "V2" || m.Name == "V2Async");
            Assert.IsNotNull(v2Methods);
            Assert.AreEqual(4, v2Methods.Count());
            foreach (var method in v2Methods)
            {
                Assert.IsTrue(method.GetParameters().Any(p => p.Name == "param"));
            }

            /* check existence of removed interface. */
            Assert.IsNotNull(Type.GetType("Versioning.Removed.V1.InterfaceV1"));

            // Only initial versions is defined
            var enumType = typeof(RemovedClientOptions.ServiceVersion);
            Assert.AreEqual(new string[] { "V1" }, enumType.GetEnumNames());
        }

        [CadlRanchTest]
        public Task Versioning_Removed_V3Model() => Test(async (host) =>
        {
            var model = new ModelV3("123", EnumV3.EnumMemberV1);
            var response = await new RemovedClient(host).ModelV3Async(model);
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("123", response.Value.Id);
            Assert.AreEqual(EnumV3.EnumMemberV1, response.Value.EnumProp);
        });
    }
}
