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

        [Test]
        public void CanRemoveVisitorByType()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            Assert.AreEqual(1, mockGenerator.Visitors.Count);

            mockGenerator.RemoveVisitor<TestLibraryVisitor>();
            Assert.AreEqual(0, mockGenerator.Visitors.Count);
        }

        [Test]
        public void RemoveVisitorDoesNothingWhenTypeNotFound()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            Assert.AreEqual(1, mockGenerator.Visitors.Count);

            mockGenerator.RemoveVisitor<DerivedTestLibraryVisitor>();
            Assert.AreEqual(1, mockGenerator.Visitors.Count);
        }

        [Test]
        public void RemoveVisitorRemovesAllMatchingInstances()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            mockGenerator.AddVisitor(new DerivedTestLibraryVisitor());
            Assert.AreEqual(3, mockGenerator.Visitors.Count);

            mockGenerator.RemoveVisitor<TestLibraryVisitor>();
            Assert.AreEqual(1, mockGenerator.Visitors.Count);
            Assert.IsInstanceOf<DerivedTestLibraryVisitor>(mockGenerator.Visitors[0]);
        }

        [Test]
        public void RemoveVisitorDoesNotRemoveDerivedType()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new DerivedTestLibraryVisitor());
            Assert.AreEqual(1, mockGenerator.Visitors.Count);

            // Removing by base type should NOT remove derived instances (exact type matching)
            mockGenerator.RemoveVisitor<TestLibraryVisitor>();
            Assert.AreEqual(1, mockGenerator.Visitors.Count);
        }

        [Test]
        public void CanRemoveVisitorByName()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            Assert.AreEqual(1, mockGenerator.Visitors.Count);

            mockGenerator.RemoveVisitor(nameof(TestLibraryVisitor));
            Assert.AreEqual(0, mockGenerator.Visitors.Count);
        }

        [Test]
        public void RemoveVisitorByNameDoesNothingWhenNameNotFound()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            Assert.AreEqual(1, mockGenerator.Visitors.Count);

            mockGenerator.RemoveVisitor("NonExistentVisitor");
            Assert.AreEqual(1, mockGenerator.Visitors.Count);
        }

        [Test]
        public void RemoveVisitorByNameRemovesAllMatchingInstances()
        {
            var mockGenerator = new TestGenerator();
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            mockGenerator.AddVisitor(new TestLibraryVisitor());
            mockGenerator.AddVisitor(new DerivedTestLibraryVisitor());
            Assert.AreEqual(3, mockGenerator.Visitors.Count);

            mockGenerator.RemoveVisitor(nameof(TestLibraryVisitor));
            Assert.AreEqual(1, mockGenerator.Visitors.Count);
            Assert.IsInstanceOf<DerivedTestLibraryVisitor>(mockGenerator.Visitors[0]);
        }

        private class DerivedTestLibraryVisitor : TestLibraryVisitor { }
    }
}
