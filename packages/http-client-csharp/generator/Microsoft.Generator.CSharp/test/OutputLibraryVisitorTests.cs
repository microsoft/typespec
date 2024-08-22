// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class OutputLibraryVisitorTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private Mock<CodeModelPlugin> _mockPlugin;
        private Mock<TypeProvider> _mockTypeProvider;
        private Mock<LibraryVisitor> _mockVisitor;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _mockPlugin = new Mock<CodeModelPlugin>();
            var mockOutputLibrary = new Mock<OutputLibrary>();
            _mockPlugin.Setup(p => p.OutputLibrary).Returns(mockOutputLibrary.Object);
            _mockTypeProvider = new Mock<TypeProvider>() { CallBase = true };
            mockOutputLibrary.Protected().Setup<TypeProvider[]>("BuildTypeProviders")
                .Returns([_mockTypeProvider.Object]);
            _mockVisitor = new Mock<LibraryVisitor> { CallBase = true };
            _mockPlugin.Object.AddVisitor(_mockVisitor.Object);
        }

        [Test]
        public void VisitsTypes()
        {
            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
        }

        [Test]
        public void VisitsMethods()
        {
            var mockMethodProvider = new Mock<MethodProvider>();
            _mockTypeProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns([mockMethodProvider.Object]);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);
            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("Visit", Times.Once(), mockMethodProvider.Object);
        }

        [Test]
        public void VisitsConstructors()
        {
            var mockConstructorProvider = new Mock<ConstructorProvider>();
            _mockTypeProvider.Protected().Setup<ConstructorProvider[]>("BuildConstructors")
                .Returns([mockConstructorProvider.Object]);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<ConstructorProvider>("Visit", Times.Once(), mockConstructorProvider.Object);
        }

        [Test]
        public void VisitsProperties()
        {
            var mockPropertyProvider = new Mock<PropertyProvider>();
            _mockTypeProvider.Protected().Setup<PropertyProvider[]>("BuildProperties")
                .Returns([mockPropertyProvider.Object]);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<PropertyProvider>("Visit", Times.Once(), mockPropertyProvider.Object);
        }

        [Test]
        public void VisitsFields()
        {
            var mockFieldProvider = new Mock<FieldProvider>();
            _mockTypeProvider.Protected().Setup<FieldProvider[]>("BuildFields")
                .Returns([mockFieldProvider.Object]);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<FieldProvider>("Visit", Times.Once(), mockFieldProvider.Object);
        }

        [Test]
        public void DoesNotVisitMethodsWhenTypeIsNulledOut()
        {
            var mockMethodProvider = new Mock<MethodProvider>();
            _mockTypeProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns([mockMethodProvider.Object]);
            _mockVisitor.Protected().Setup<TypeProvider?>("Visit", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("Visit", Times.Never(), mockMethodProvider.Object);
        }

        [Test]
        public void DoesNotVisitConstructorsWhenTypeIsNulledOut()
        {
            var mockConstructorProvider = new Mock<ConstructorProvider>();
            _mockTypeProvider.Protected().Setup<ConstructorProvider[]>("BuildConstructors")
                .Returns([mockConstructorProvider.Object]);
            _mockVisitor.Protected().Setup<TypeProvider?>("Visit", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<ConstructorProvider>("Visit", Times.Never(), mockConstructorProvider.Object);
        }

        [Test]
        public void DoesNotVisitPropertiesWhenTypeIsNulledOut()
        {
            var mockFieldProvider = new Mock<PropertyProvider>();
            _mockTypeProvider.Protected().Setup<PropertyProvider[]>("BuildProperties")
                .Returns([mockFieldProvider.Object]);
            _mockVisitor.Protected().Setup<TypeProvider?>("Visit", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<PropertyProvider>("Visit", Times.Never(), mockFieldProvider.Object);
        }

        [Test]
        public void DoesNotVisitFieldsWhenTypeIsNulledOut()
        {
            var mockFieldProvider = new Mock<FieldProvider>();
            _mockTypeProvider.Protected().Setup<FieldProvider[]>("BuildFields")
                .Returns([mockFieldProvider.Object]);
            _mockVisitor.Protected().Setup<TypeProvider?>("Visit", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<FieldProvider>("Visit", Times.Never(), mockFieldProvider.Object);
        }
    }
}
