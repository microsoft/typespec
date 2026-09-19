// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Primitives.CSharpType;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class TypeSymbolExtensionsTests
    {
        private const string SampleStructFullName = "Sample.SampleStruct";

        [SetUp]
        public void SetUp()
        {
            // Configure a TypeFactory whose CreateFrameworkType override maps
            // "Sample.SampleStruct" to typeof(Guid) (any loaded value type works).
            // Use the real LoadMockGenerator setup so CodeModelGenerator.Instance is wired up.
            MockHelpers.LoadMockGenerator();

            var mockTypeFactory = Mock.Get(CodeModelGenerator.Instance.TypeFactory);
            mockTypeFactory
                .Protected()
                .Setup<Type?>("CreateFrameworkType", ItExpr.IsAny<string>())
                .Returns((string fqn) => fqn == SampleStructFullName ? typeof(Guid) : null);
        }

        [Test]
        public async Task NullableValueTypeOfKnownFrameworkTypeResolvesToNullableFrameworkCSharpType()
        {
            // Regression: TypeFactory.CreateFrameworkType resolves known framework types by their
            // bare fully-qualified name (e.g. "Azure.ETag" => typeof(ETag)), but the symbol-derived
            // FQN for a Nullable<T> wraps that name as "System.Nullable`1[[Azure.ETag]]", which no
            // override matches and Type.GetType cannot resolve. Without the Nullable<T> fallback
            // in GetCSharpType, the result was a symbol-based CSharpType (with _type == null) that
            // failed equality against framework-typed CSharpTypes (e.g. typeof(ETag)) used as keys
            // in serialization handler tables.
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var propertySymbol = GetPropertySymbol(compilation, "Container", "Nullable");

            // Sanity: the property symbol is the constructed Nullable<SampleStruct>.
            var propertyTypeSymbol = (INamedTypeSymbol)propertySymbol.Type;
            Assert.AreEqual(SpecialType.System_Nullable_T, propertyTypeSymbol.ConstructedFrom.SpecialType);

            var csharpType = propertySymbol.Type.GetCSharpType();

            Assert.IsTrue(csharpType.IsFrameworkType, "Expected a framework-typed CSharpType.");
            Assert.AreEqual(typeof(Guid), csharpType.FrameworkType);
            Assert.IsTrue(csharpType.IsNullable, "Expected nullability to be preserved.");
            Assert.IsTrue(csharpType.Equals(new CSharpType(typeof(Guid), isNullable: true)));
        }

        [Test]
        public async Task NullableValueTypeOfKnownFrameworkTypeMatchesIgnoreNullableComparer()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var propertySymbol = GetPropertySymbol(compilation, "Container", "Nullable");

            var csharpType = propertySymbol.Type.GetCSharpType();

            var comparer = new CSharpTypeIgnoreNullableComparer();
            Assert.IsTrue(comparer.Equals(csharpType, new CSharpType(typeof(Guid))));
        }

        [Test]
        public async Task NonNullableKnownFrameworkTypeResolvesUnchanged()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var propertySymbol = GetPropertySymbol(compilation, "Container", "NonNullable");

            var csharpType = propertySymbol.Type.GetCSharpType();

            Assert.IsTrue(csharpType.IsFrameworkType);
            Assert.AreEqual(typeof(Guid), csharpType.FrameworkType);
            Assert.IsFalse(csharpType.IsNullable);
        }

        [Test]
        public async Task NullableReferenceGenericTypeDoesNotResolveToNullable()
        {
            // Regression: a nullable annotation on a generic reference type (e.g. BicepValue<string>?)
            // must not be treated as System.Nullable<T>. Previously GetFullyQualifiedName produced
            // "System.Nullable`1[[System.String]]", which caused TypeFactory.CreateFrameworkType to
            // attempt building Nullable<string> and crash because string is not a value type.
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var propertySymbol = GetPropertySymbol(compilation, "Container", "Nullable");

            // Sanity: the property symbol is a nullable-annotated reference type, not System.Nullable<T>.
            var propertyTypeSymbol = (INamedTypeSymbol)propertySymbol.Type;
            Assert.AreEqual(NullableAnnotation.Annotated, propertyTypeSymbol.NullableAnnotation);
            Assert.AreNotEqual(SpecialType.System_Nullable_T, propertyTypeSymbol.ConstructedFrom.SpecialType);

            var fullyQualifiedName = propertySymbol.Type.GetFullyQualifiedName();
            Assert.AreEqual("Sample.BicepValue`1[System.String]", fullyQualifiedName);

            var csharpType = propertySymbol.Type.GetCSharpType();

            Assert.AreEqual("BicepValue", csharpType.Name);
            Assert.AreEqual("Sample", csharpType.Namespace);
            Assert.IsFalse(csharpType.IsNullable, "A nullable reference annotation must not be modeled as Nullable<T>.");
            Assert.AreEqual(1, csharpType.Arguments.Count);
            Assert.AreEqual("String", csharpType.Arguments[0].Name);
        }

        [Test]
        public async Task TypeParameterDoesNotResolveContainingGenericType()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var typeSymbol = compilation.GetTypeByMetadataName("Sample.GenericContainer`1");
            Assert.IsNotNull(typeSymbol, "Failed to resolve generic type symbol from compiled source.");

            var csharpType = typeSymbol!.TypeParameters[0].GetCSharpType();

            Assert.AreEqual("T", csharpType.Name);
            Assert.IsNull(csharpType.DeclaringType);
        }

        [Test]
        public void CollectionGenericSymbolWithoutAngleBracketDisplayNameGetsFullyQualifiedMetadataName()
        {
            var compilation = CSharpCompilation.Create(
                "TestAssembly",
                [CSharpSyntaxTree.ParseText("""
                using System.Collections.Generic;

                namespace Sample
                {
                    public class Container
                    {
                        public IReadOnlyList<string> GetResult() => null;
                    }
                }
                """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var method = compilation.GetTypeByMetadataName("Sample.Container")!
                .GetMembers("GetResult")
                .OfType<IMethodSymbol>()
                .Single();

            var name = method.ReturnType.GetFullyQualifiedName();

            Assert.AreEqual("System.Collections.Generic.IReadOnlyList`1", name);
        }

        private static IPropertySymbol GetPropertySymbol(Compilation compilation, string containerName, string propertyName)
        {
            var typeSymbol = compilation.GetTypeByMetadataName($"Sample.{containerName}");
            Assert.IsNotNull(typeSymbol, $"Failed to resolve 'Sample.{containerName}' type symbol from compiled source.");
            var propertySymbol = typeSymbol!.GetMembers(propertyName).OfType<IPropertySymbol>().FirstOrDefault();
            Assert.IsNotNull(propertySymbol, $"Failed to resolve property '{propertyName}'.");
            return propertySymbol!;
        }

        [TestCase("Model", false)]
        [TestCase("Model", true)]
        [TestCase("FixedEnum", false)]
        [TestCase("FixedEnum", true)]
        [TestCase("ExtensibleEnum", false)]
        [TestCase("ExtensibleEnum", true)]
        public async Task UnresolvedGeneratedTypes(string name, bool isNullable)
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var generator = MockHelpers.LoadMockGenerator().Object;
            CSharpType expected = name == "Model"
                ? generator.TypeFactory.CreateModel(InputFactory.Model(name))!.Type
                : generator.TypeFactory.CreateEnum(InputFactory.StringEnum(
                    name, [("Value", "value")], isExtensible: name == "ExtensibleEnum"))!.Type;
            var symbol = GetPropertySymbol(compilation, "Container", isNullable ? $"Nullable{name}" : name).Type;
            var unresolvedSymbol = isNullable ? ((INamedTypeSymbol)symbol).TypeArguments.Single() : symbol;
            Assert.AreEqual(TypeKind.Error, unresolvedSymbol.TypeKind);

            var type = symbol.GetCSharpType();

            Assert.AreEqual(expected.WithNullable(isNullable), type);
            Assert.AreEqual(expected.IsEnum, type.IsEnum);
            Assert.AreEqual(expected.IsStruct, type.IsStruct);
            Assert.AreEqual(expected.IsValueType, type.IsValueType);
            Assert.AreEqual(expected.IsPublic, type.IsPublic);
        }

        [Test]
        public async Task UnresolvedGeneratedTypesInGenericArguments()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: nameof(UnresolvedGeneratedTypes));
            var generator = MockHelpers.LoadMockGenerator().Object;
            var expected = generator.TypeFactory.CreateModel(InputFactory.Model("Model"))!.Type;
            var symbol = GetPropertySymbol(compilation, "Container", "Dictionary").Type;

            var type = symbol.GetCSharpType();

            Assert.AreEqual(typeof(System.Collections.Generic.IDictionary<,>), type.FrameworkType);
            Assert.AreEqual(expected, type.Arguments[0]);
            Assert.AreEqual(expected, type.Arguments[1].Arguments[0]);
        }

        [TestCase("Missing", "Missing", "")]
        [TestCase("Qualified", "Model", "Other")]
        [TestCase("Resolved", "Model", "Resolved")]
        [TestCase("Global", "GlobalModel", "")]
        [TestCase("Generic", "Model", "")]
        public async Task OtherTypesDoNotResolveByGeneratedName(string property, string name, string expectedNamespace)
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: nameof(UnresolvedGeneratedTypes));
            var generator = MockHelpers.LoadMockGenerator().Object;
            generator.TypeFactory.CreateModel(InputFactory.Model("Model"));
            generator.TypeFactory.CreateModel(InputFactory.Model("GlobalModel"));

            var type = GetPropertySymbol(compilation, "Container", property).Type.GetCSharpType();

            Assert.AreEqual(name, type.Name);
            Assert.AreEqual(expectedNamespace, type.Namespace);
            if (property == "Generic")
            {
                Assert.AreEqual(1, type.Arguments.Count);
            }
        }
    }
}
