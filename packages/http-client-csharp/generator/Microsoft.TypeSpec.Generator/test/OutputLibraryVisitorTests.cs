// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class OutputLibraryVisitorTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private Mock<CodeModelGenerator> _mockGenerator;
        private Mock<TypeProvider> _mockTypeProvider;
        private Mock<LibraryVisitor> _mockVisitor;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _mockGenerator = MockHelpers.LoadMockGenerator();
            var mockOutputLibrary = new Mock<OutputLibrary>();
            _mockGenerator.Setup(p => p.OutputLibrary).Returns(mockOutputLibrary.Object);
            _mockTypeProvider = new Mock<TypeProvider>() { CallBase = true };
            mockOutputLibrary.Protected().Setup<TypeProvider[]>("BuildTypeProviders")
                .Returns([_mockTypeProvider.Object]);
            _mockVisitor = new Mock<LibraryVisitor> { CallBase = true };
            _mockGenerator.Object.AddVisitor(_mockVisitor.Object);
        }

        [Test]
        public void VisitsTypes()
        {
            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
        }

        [Test]
        public void VisitsMethods()
        {
            var testMethod = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());

            _mockTypeProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns([testMethod]);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);
            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("VisitMethod", Times.Once(), testMethod);
        }

        [Test]
        public void VisitsConstructors()
        {
            var testConstructor = new ConstructorProvider(
                new ConstructorSignature(typeof(TestTypeProvider), $"", MethodSignatureModifiers.Public, []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<ConstructorProvider[]>("BuildConstructors")
                .Returns([testConstructor]);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<ConstructorProvider>("VisitConstructor", Times.Once(), testConstructor);
        }

        [Test]
        public void VisitsProperties()
        {
            var testProperty = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string),
                "Name", new AutoPropertyBody(true), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<PropertyProvider[]>("BuildProperties")
                .Returns([testProperty]);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<PropertyProvider>("VisitProperty", Times.Once(), testProperty);
        }

        [Test]
        public void VisitsFields()
        {
            var mockFieldProvider = new Mock<FieldProvider>();
            _mockTypeProvider.Protected().Setup<FieldProvider[]>("BuildFields")
                .Returns([mockFieldProvider.Object]);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<FieldProvider>("VisitField", Times.Once(), mockFieldProvider.Object);
        }

        [Test]
        public void VisitsSerializationProviderMembers()
        {
            var mockSerializationProvider = new Mock<TypeProvider>() { CallBase = true };
            _mockTypeProvider.Protected().Setup<TypeProvider[]>("BuildSerializationProviders")
                .Returns([mockSerializationProvider.Object]);
            var sig = new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []);
            var mockMethodProvider = new Mock<MethodProvider>(MockBehavior.Default, sig, MethodBodyStatement.Empty,
                mockSerializationProvider.Object, new XmlDocProvider(), new List<SuppressionStatement>())
            {
                CallBase = true
            };
            mockSerializationProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns([mockMethodProvider.Object]);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), mockSerializationProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("VisitMethod", Times.Once(), mockMethodProvider.Object);
        }

        [Test]
        public void DoesNotVisitMethodsWhenTypeIsNulledOut()
        {
            var testMethod = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());

            _mockTypeProvider.Protected().Setup<MethodProvider[]>("BuildMethods")
                .Returns([testMethod]);
            _mockVisitor.Protected().Setup<TypeProvider?>("VisitType", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<MethodProvider>("VisitMethod", Times.Never(), testMethod);
        }

        [Test]
        public void DoesNotVisitConstructorsWhenTypeIsNulledOut()
        {
            var testConstructor = new ConstructorProvider(
                new ConstructorSignature(typeof(TestTypeProvider), $"", MethodSignatureModifiers.Public, []),
                Snippet.ThrowExpression(Snippet.Null), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<ConstructorProvider[]>("BuildConstructors")
                .Returns([testConstructor]);
            _mockVisitor.Protected().Setup<TypeProvider?>("VisitType", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<ConstructorProvider>("VisitConstructor", Times.Never(), testConstructor);
        }

        [Test]
        public void DoesNotVisitPropertiesWhenTypeIsNulledOut()
        {
            var testProperty = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string),
                "Name", new AutoPropertyBody(true), new TestTypeProvider());
            _mockTypeProvider.Protected().Setup<PropertyProvider[]>("BuildProperties")
                .Returns([testProperty]);
            _mockVisitor.Protected().Setup<TypeProvider?>("VisitType", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<PropertyProvider>("VisitProperty", Times.Never(), testProperty);
        }

        [Test]
        public void DoesNotVisitFieldsWhenTypeIsNulledOut()
        {
            var mockFieldProvider = new Mock<FieldProvider>();
            _mockTypeProvider.Protected().Setup<FieldProvider[]>("BuildFields")
                .Returns([mockFieldProvider.Object]);
            _mockVisitor.Protected().Setup<TypeProvider?>("VisitType", _mockTypeProvider.Object).Returns<TypeProvider?>(
                (t) => null);

            _mockVisitor.Object.VisitLibrary(_mockGenerator.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("VisitType", Times.Once(), _mockTypeProvider.Object);
            _mockVisitor.Protected().Verify<FieldProvider>("VisitField", Times.Never(), mockFieldProvider.Object);
        }

        [Test]
        public void VisitMethodToRenameParameterName()
        {
            var parameter = new ParameterProvider("oldName", $"", typeof(string));
            var testMethod = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", [parameter]),
                Snippet.Return(parameter), new TestTypeProvider());

            testMethod.Accept(new MethodVisitor());

            Assert.AreEqual("newName", testMethod.Signature.Parameters.First().Name);
            Assert.AreEqual("return newName;\n", testMethod?.BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task MatchingMethodSignatureIsFilteredAfterVisitorMutation()
        {
            var typeProvider = new TestTypeProvider();
            var methodProvider = new MethodProvider(
                new MethodSignature("TestMethod", $"", MethodSignatureModifiers.Public, null, $"", [new ParameterProvider("param1", $"", typeof(float))]),
                Snippet.Throw(Snippet.Null), typeProvider);
            typeProvider.Update(methods: [methodProvider], reset: true);

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(typeProvider),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var visitor = new TestFilterVisitor();
            visitor.VisitLibrary(generator.Object.OutputLibrary);

            typeProvider.Update(methods: typeProvider.FilterCustomizedMethods(typeProvider.Methods));

            Assert.AreEqual(0, typeProvider.Methods.Count);
        }

        [Test]
        public async Task MethodIsNotFilteredWhenVisitorChangesSignature()
        {
            // Use a type provider subclass with mutable BuildMethods to avoid setting
            // the TypeProvider._methods cache directly (which would bypass EnsureBuilt's
            // new code path that calls BuildMethods without filtering).
            var typeProvider = new MutableMethodsTypeProvider();
            var methodProvider = new MethodProvider(
                new MethodSignature("TestMethod", $"", MethodSignatureModifiers.Public, null, $"",
                    [new ParameterProvider("param1", $"", typeof(int))]),
                Snippet.Throw(Snippet.Null), typeProvider);
            typeProvider.MethodProviders = [methodProvider];

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(typeProvider),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Reset to reinitialize CustomCodeView now that the mock generator is set up
            typeProvider.Update(reset: true);

            // Step 1: Build all types (simulating CSharpGen.ExecuteAsync)
            // EnsureBuilt bypasses customization filtering, so the method is preserved
            foreach (var type in generator.Object.OutputLibrary.TypeProviders)
            {
                type.EnsureBuilt();
            }

            // Verify that the custom code is correctly loaded and the method is present
            Assert.IsNotNull(typeProvider.CustomCodeView, "CustomCodeView should not be null");
            Assert.AreEqual(1, typeProvider.Methods.Count, "Method should be present after EnsureBuilt");

            // Step 2: Visitor changes the parameter type from int to float,
            // so it no longer matches the custom code
            var visitor = new ChangeParameterTypeVisitor("TestMethod", typeof(float));
            visitor.VisitLibrary(generator.Object.OutputLibrary);

            // Step 3: Apply customization filtering after visitor
            typeProvider.Update(methods: typeProvider.FilterCustomizedMethods(typeProvider.Methods));

            // The method should NOT be filtered because the visitor changed its signature
            // to no longer match the custom code
            Assert.AreEqual(1, typeProvider.Methods.Count);
            Assert.AreEqual("TestMethod", typeProvider.Methods[0].Signature.Name);
            Assert.AreEqual(typeof(float), typeProvider.Methods[0].Signature.Parameters[0].Type.FrameworkType);
        }

        [Test]
        public async Task MatchingConstructorSignatureIsFilteredAfterVisitorMutation()
        {
            var typeProvider = new TestTypeProvider();
            var constructor = new ConstructorProvider(
                new ConstructorSignature(typeProvider.Type, $"", MethodSignatureModifiers.Public, [new ParameterProvider("param1", $"", typeof(float))]),
                Snippet.Throw(Snippet.Null), typeProvider);
            typeProvider.Update(constructors: [constructor], reset: true);

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(typeProvider),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var visitor = new TestFilterVisitor();
            visitor.VisitLibrary(generator.Object.OutputLibrary);

            typeProvider.Update(constructors: typeProvider.FilterCustomizedConstructors(typeProvider.Constructors));

            Assert.AreEqual(0, typeProvider.Constructors.Count);
        }

        [Test]
        public async Task MatchingPropertyIsFilteredAfterVisitorMutation()
        {
            var typeProvider = new TestTypeProvider();
            var property = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string),
                "TestProperty", new AutoPropertyBody(true), typeProvider);
            typeProvider.Update(properties: [property], reset: true);

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(typeProvider),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var visitor = new TestFilterVisitor();
            visitor.VisitLibrary(generator.Object.OutputLibrary);

            typeProvider.Update(properties: typeProvider.FilterCustomizedProperties(typeProvider.Properties));

            Assert.AreEqual(0, typeProvider.Properties.Count);
        }

        [Test]
        public async Task MatchingFieldIsFilteredAfterVisitorMutation()
        {
            var typeProvider = new TestTypeProvider();
            var field = new FieldProvider(FieldModifiers.Public, typeof(string), "TestField", typeProvider);
            typeProvider.Update(fields: [field], reset: true);

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(typeProvider),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var visitor = new TestFilterVisitor();
            visitor.VisitLibrary(generator.Object.OutputLibrary);

            typeProvider.Update(fields: typeProvider.FilterCustomizedFields(typeProvider.Fields));

            Assert.AreEqual(0, typeProvider.Fields.Count);
        }

        [Test]
        public async Task MultipleVisitorsMutateMember()
        {
            var typeProvider = new TestTypeProvider();
            var methodProvider = new MethodProvider(
                new MethodSignature("OriginalMethod", $"", MethodSignatureModifiers.Public, null, $"", [new ParameterProvider("param1", $"", typeof(float))]),
                Snippet.Throw(Snippet.Null), typeProvider);
            typeProvider.Update(methods: [methodProvider], reset: true);

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(typeProvider),
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var visitor1 = new RenameMethodVisitor("OriginalMethod", "TestMethod");
            var visitor2 = new ChangeParameterTypeVisitor("TestMethod", typeof(int));

            visitor1.VisitLibrary(generator.Object.OutputLibrary);
            visitor2.VisitLibrary(generator.Object.OutputLibrary);

            typeProvider.Update(methods: typeProvider.FilterCustomizedMethods(typeProvider.Methods));

            Assert.AreEqual(0, typeProvider.Methods.Count);
        }

        private class RenameMethodVisitor : LibraryVisitor
        {
            private readonly string _originalName;
            private readonly string _newName;

            public RenameMethodVisitor(string originalName, string newName)
            {
                _originalName = originalName;
                _newName = newName;
            }

            protected internal override MethodProvider? VisitMethod(MethodProvider method)
            {
                if (method.Signature.Name == _originalName)
                {
                    method.Signature.Update(name: _newName);
                }
                return method; // Return method even if not renamed, to allow further visiting (though logic here seems to not matter much as LibraryVisitor base is used or visitor logic)
            }
        }

        private class ChangeParameterTypeVisitor : LibraryVisitor
        {
            private readonly string _methodName;
            private readonly System.Type _newType;

            public ChangeParameterTypeVisitor(string methodName, System.Type newType)
            {
                _methodName = methodName;
                _newType = newType;
            }

            protected internal override MethodProvider? VisitMethod(MethodProvider method)
            {
                if (method.Signature.Name == _methodName)
                {
                    method.Signature.Parameters[0].Update(type: _newType);
                }
                return method;
            }
        }


        private class TestFilterVisitor : LibraryVisitor
        {
            protected internal override MethodProvider? VisitMethod(MethodProvider method)
            {
                if (method.Signature.Name == "TestMethod")
                {
                    method.Signature.Parameters[0].Update(type: typeof(int));
                }
                return method;
            }

            protected override ConstructorProvider? VisitConstructor(ConstructorProvider constructor)
            {
                if (constructor.Signature.Parameters.Count > 0)
                {
                    constructor.Signature.Parameters[0].Update(type: typeof(int));
                }
                return constructor;
            }

            protected override PropertyProvider? VisitProperty(PropertyProvider property)
            {
                if (property.Name == "TestProperty")
                {
                    property.Update(name: "UpdatedProperty");
                }
                return property;
            }

            protected override FieldProvider? VisitField(FieldProvider field)
            {
                if (field.Name == "TestField")
                {
                    field.Update(name: "UpdatedField");
                }
                return field;
            }
        }

        private class MethodVisitor : LibraryVisitor
        {
            protected internal override MethodProvider? VisitMethod(MethodProvider method)
            {
                // Rename the parameter to "newName"
                foreach (var parameter in method.Signature.Parameters)
                {
                    if (parameter.Name == "oldName")
                    {
                        parameter.Update("newName");
                    }
                }
                return base.VisitMethod(method);
            }
        }

        /// <summary>
        /// A TypeProvider subclass that allows setting methods after construction via BuildMethods,
        /// which avoids writing to the TypeProvider._methods cache directly.
        /// This is needed for tests that exercise EnsureBuilt's code path.
        /// </summary>
        private class MutableMethodsTypeProvider : TypeProvider
        {
            public MethodProvider[] MethodProviders { get; set; } = [];
            protected override string BuildRelativeFilePath() => $"{Name}.cs";
            protected override string BuildName() => "TestName";
            protected override string BuildNamespace() => "Test";
            protected internal override MethodProvider[] BuildMethods() => MethodProviders;
        }
    }
}
