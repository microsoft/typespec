// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
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
            _mockPlugin = MockHelpers.LoadMockPlugin();
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
            var testMethod = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());

            _mockTypeProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns([testMethod]);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);
            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("Visit", Times.Once(), testMethod);
        }

        [Test]
        public void VisitsConstructors()
        {
            var testConstructor = new ConstructorProvider(
                new ConstructorSignature(typeof(TestTypeProvider), $"", MethodSignatureModifiers.Public, []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<ConstructorProvider[]>("BuildConstructors")
                .Returns([testConstructor]);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<ConstructorProvider>("Visit", Times.Once(), testConstructor);
        }

        [Test]
        public void VisitsProperties()
        {
            var testProperty = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string),
                "Name", new AutoPropertyBody(true), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<PropertyProvider[]>("BuildProperties")
                .Returns([testProperty]);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<PropertyProvider>("Visit", Times.Once(), testProperty);
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
            var testMethod = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());

            _mockTypeProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns([testMethod]);
            _mockVisitor.Protected().Setup<TypeProvider?>("Visit", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("Visit", Times.Never(), testMethod);
        }

        [Test]
        public void DoesNotVisitConstructorsWhenTypeIsNulledOut()
        {
            var testConstructor = new ConstructorProvider(
                new ConstructorSignature(typeof(TestTypeProvider), $"", MethodSignatureModifiers.Public, []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<ConstructorProvider[]>("BuildConstructors")
                .Returns([testConstructor]);
            _mockVisitor.Protected().Setup<TypeProvider?>("Visit", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<ConstructorProvider>("Visit", Times.Never(), testConstructor);
        }

        [Test]
        public void DoesNotVisitPropertiesWhenTypeIsNulledOut()
        {
            var testProperty = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string),
                "Name", new AutoPropertyBody(true), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<PropertyProvider[]>("BuildProperties")
                .Returns([testProperty]);
            _mockVisitor.Protected().Setup<TypeProvider?>("Visit", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<PropertyProvider>("Visit", Times.Never(), testProperty);
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
