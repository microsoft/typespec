// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Reflection;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class UnreferencedTypeTests
    {
        [Test]
        public void InternalHelperTypesAreKept()
        {
            var types = Assembly.GetAssembly(typeof(SampleTypeSpecClient))!.GetTypes();
            Assert.IsTrue(types.Any(t => t.Name == "BinaryContentHelper"));
            Assert.IsTrue(types.Any(t => t.Name == "PipelineRequestHeadersExtensions"));
            Assert.IsTrue(types.Any(t => t.Name == "Utf8JsonBinaryContent"));
        }
    }
}
