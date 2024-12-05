// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System;
using System.Linq;
using Versioning.RenamedFrom.V2;
using Versioning.RenamedFrom.V2.Models;

namespace TestProjects.CadlRanch.Tests.Http.Versioning.RenamedFrom.V1
{
    public class VersioningRenamedFromTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public void TestRenamedMembers()
        {
            Assert.IsNotNull(Type.GetType("Versioning.RenamedFrom.V1.Models.OldModel"));
            Assert.IsNull(Type.GetType("Versioning.RenamedFrom.V1.Models.NewModel"));

            /* check the renamed property of model */
            var properties = typeof(NewModel).GetProperties();
            Assert.IsNotNull(properties);
            Assert.AreEqual(3, properties.Length);
            Assert.IsNull(typeof(NewModel).GetProperty("OldProp"));
            Assert.IsNotNull(typeof(NewModel).GetProperty("NewProp"));

            /* check the renamed enum from `OldEnum` to `NewEnum` */
            Assert.IsNotNull(Type.GetType("Versioning.RenamedFrom.V1.Models.OldEnum"));
            Assert.IsNull(Type.GetType("Versioning.RenamedFrom.V1.Models.NewEnum"));

            /* check the renamed enum value */
            var enumValues = typeof(NewEnum).GetEnumNames();
            Assert.IsNotNull(enumValues);
            Assert.AreEqual(1, enumValues.Length);
            Assert.IsFalse(enumValues.Contains("OldEnumMember"));
            Assert.IsTrue(enumValues.Contains("NewEnumMember"));

            /* check the renamed operation */
            var oldMethods = typeof(RenamedFromClient).GetMethods().Where(m => m.Name == "OldOp" || m.Name == "OldOpAsync");
            Assert.AreEqual(0, oldMethods.Count());
            var newMethods = typeof(RenamedFromClient).GetMethods().Where(m => m.Name == "NewOp" || m.Name == "NewOpAsync");
            Assert.AreEqual(4, newMethods.Count());

            /* check the renamed interface */
            Assert.IsNotNull(Type.GetType("Versioning.RenamedFrom.V1.OldInterface"));
            Assert.IsNull(Type.GetType("Versioning.RenamedFrom.V1.NewInterface"));
        }
    }
}
