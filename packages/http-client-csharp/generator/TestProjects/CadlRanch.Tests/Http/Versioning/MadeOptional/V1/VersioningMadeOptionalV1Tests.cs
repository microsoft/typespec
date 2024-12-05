// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System.Linq;
using Versioning.MadeOptional.V1.Models;

namespace TestProjects.CadlRanch.Tests.Http.Versioning.MadeOptional.V1
{
    public class VersioningMadeOptionalV1Tests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public void CheckMadeOptionalMembers()
        {
            var constructors = typeof(TestModel).GetConstructors();
            Assert.IsNotNull(constructors);
            Assert.AreEqual(1, constructors.Length);
            /* property will not in public constructor signature. */
            Assert.IsTrue(constructors[0].GetParameters().Any(p => p.Name == "changedProp"));
        }
    }
}
