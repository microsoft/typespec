// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class OutputLibraryVisitorTests
    {
        // these are initialized in Setup
        private Mock<OutputLibrary> _mockOutputLibrary = null!;
        private Mock<TypeProvider> _mockTypeProvider = null!;
        private Mock<OutputLibraryVisitor> _mockVisitor = null!;

        [SetUp]
        public void Setup()
        {
            _mockOutputLibrary = new Mock<OutputLibrary>();
            _mockTypeProvider = new Mock<TypeProvider>();
            _mockOutputLibrary.Protected().Setup<TypeProvider[]>("BuildTypeProviders")
                .Returns(new TypeProvider[] { _mockTypeProvider.Object });
            _mockVisitor = new Mock<OutputLibraryVisitor> { CallBase = true };
            _mockOutputLibrary.Object.AddVisitor(_mockVisitor.Object);
        }

        [Test]
        public void VisitsTypes()
        {
            _mockVisitor.Object.Visit(_mockOutputLibrary.Object);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
        }

        [Test]
        public void VisitsMethods()
        {
            var mockMethodProvider = new Mock<MethodProvider>();
            _mockTypeProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns(new MethodProvider[] { mockMethodProvider.Object });

            _mockVisitor.Object.Visit(_mockOutputLibrary.Object);
            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("Visit", Times.Once(), _mockTypeProvider.Object, mockMethodProvider.Object);
        }

        [Test]
        public void VisitsConstructors()
        {
            var mockConstructorProvider = new Mock<ConstructorProvider>();
            _mockTypeProvider.Protected().Setup<ConstructorProvider[]>("BuildConstructors")
                .Returns(new ConstructorProvider[] { mockConstructorProvider.Object });

            _mockVisitor.Object.Visit(_mockOutputLibrary.Object);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<ConstructorProvider>("Visit", Times.Once(), _mockTypeProvider.Object, mockConstructorProvider.Object);
        }

        [Test]
        public void VisitsProperties()
        {
            var mockPropertyProvider = new Mock<PropertyProvider>();
            _mockTypeProvider.Protected().Setup<PropertyProvider[]>("BuildProperties")
                .Returns(new PropertyProvider[] { mockPropertyProvider.Object });

            _mockVisitor.Object.Visit(_mockOutputLibrary.Object);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<PropertyProvider>("Visit", Times.Once(), _mockTypeProvider.Object, mockPropertyProvider.Object);
        }

        [Test]
        public void VisitsFields()
        {
            var mockPropertyProvider = new Mock<FieldProvider>();
            _mockTypeProvider.Protected().Setup<FieldProvider[]>("BuildFields")
                .Returns(new FieldProvider[] { mockPropertyProvider.Object });

            _mockVisitor.Object.Visit(_mockOutputLibrary.Object);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<FieldProvider>("Visit", Times.Once(), _mockTypeProvider.Object, mockPropertyProvider.Object);
        }
    }
}
