// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

extern alias MadeOptionalV1;

using System.Linq;
using MadeOptionalV1::Versioning.MadeOptional;
using NUnit.Framework;

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
