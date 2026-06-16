// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
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

        [Test]
        public void HasDefaultCustomCodeAttributeProviders()
        {
            var mockGenerator = new TestGenerator();
            Assert.AreEqual(4, mockGenerator.CustomCodeAttributeProviders.Count);
        }

        [Test]
        public void CanAddCustomCodeAttributeProvider()
        {
            var mockGenerator = new TestGenerator();
            var initialCount = mockGenerator.CustomCodeAttributeProviders.Count;

            var provider = new TestTypeProvider();
            mockGenerator.AddCustomCodeAttributeProviderForTest(provider);

            Assert.AreEqual(initialCount + 1, mockGenerator.CustomCodeAttributeProviders.Count);
            Assert.AreSame(provider, mockGenerator.CustomCodeAttributeProviders[^1]);
        }

        // Reproduces the real CSharpGen.ExecuteAsync ordering where contributed custom-code attribute providers are
        // written before SourceInputModel is initialized. A CustomCodeAttributeDefinition disables the source-input
        // views, so accessing its Name/Type (and the views directly) must not throw.
        [Test]
        public void CustomCodeAttributeDefinitionDoesNotEvaluateSourceInputViews()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator();
            // Simulate SourceInputModel not being initialized yet, as is the case when the contributed attribute
            // provider is written into the custom-code workspace.
            mockGenerator
                .Setup(p => p.SourceInputModel)
                .Throws(new InvalidOperationException("SourceInputModel has not been initialized yet"));

            var attributeDefinition = new TestCustomCodeAttributeDefinition();

            Assert.IsNull(attributeDefinition.CustomCodeView);
            Assert.IsNull(attributeDefinition.LastContractView);
            Assert.DoesNotThrow(() => _ = attributeDefinition.Name);
            Assert.DoesNotThrow(() => _ = attributeDefinition.Type);

            // A regular TypeProvider would still attempt to resolve the source-input views and therefore throw.
            var regularProvider = new TestTypeProvider();
            Assert.Throws<InvalidOperationException>(() => _ = regularProvider.CustomCodeView);
        }

        private class DerivedTestLibraryVisitor : TestLibraryVisitor { }
    }
}
