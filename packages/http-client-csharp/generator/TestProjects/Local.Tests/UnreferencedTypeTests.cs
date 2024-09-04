// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Reflection;
using NUnit.Framework;
using UnbrandedTypeSpec;

namespace TestProjects.Local.Tests
{
    public class UnreferencedTypeTests
    {
        [Test]
        public void UnreferencedTypesAreRemoved()
        {
            var types = Assembly.GetAssembly(typeof(UnbrandedTypeSpecClient))!.GetTypes();
            Assert.IsFalse(types.Any(t => t.Name == "BinaryContentHelper"));
            Assert.IsFalse(types.Any(t => t.Name == "PipelineRequestHeadersExtensions"));
            Assert.IsFalse(types.Any(t => t.Name == "Utf8JsonBinaryContent"));
        }
    }
}
