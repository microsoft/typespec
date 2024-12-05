// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using NUnit.Framework;
using Versioning.Removed.V1;

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
    }
}
