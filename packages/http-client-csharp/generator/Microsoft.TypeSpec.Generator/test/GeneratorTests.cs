// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    internal class GeneratorTests
    {
        [Test]
        public void CanAddVisitors()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            Assert.AreEqual(1, mockGenerator.Visitors.Count);
        }
    }
}
