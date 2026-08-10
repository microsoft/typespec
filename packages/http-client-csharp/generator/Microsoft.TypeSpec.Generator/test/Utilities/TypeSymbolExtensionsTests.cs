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
        public async Task ConstructedGenericSymbolReturnsGenericTypeDefinition()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: nameof(NullableReferenceGenericTypeDoesNotResolveToNullable));
            var propertySymbol = GetPropertySymbol(compilation, "Container", "Nullable");

            var genericTypeDefinition = propertySymbol.Type.GetCSharpType().GetGenericTypeDefinition();

            Assert.AreEqual("BicepValue", genericTypeDefinition.Name);
            Assert.AreEqual("Sample", genericTypeDefinition.Namespace);
            Assert.IsFalse(genericTypeDefinition.IsNullable);
            Assert.AreEqual(1, genericTypeDefinition.Arguments.Count);
            Assert.AreEqual("T", genericTypeDefinition.Arguments[0].Name);
        }

        [Test]
        public async Task OpenGenericSymbolReturnsItselfAsGenericTypeDefinition()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: nameof(NullableReferenceGenericTypeDoesNotResolveToNullable));
            var typeSymbol = compilation.GetTypeByMetadataName("Sample.BicepValue`1");
            Assert.IsNotNull(typeSymbol);

            var type = typeSymbol!.GetCSharpType();

            Assert.AreSame(type, type.GetGenericTypeDefinition());
        }

        [Test]
        public async Task NullableConstructedGenericValueSymbolReturnsUnderlyingGenericTypeDefinition()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: nameof(NullableReferenceGenericTypeDoesNotResolveToNullable));
            var propertySymbol = GetPropertySymbol(compilation, "Container", "NullableValue");

            var type = propertySymbol.Type.GetCSharpType();
            var genericTypeDefinition = type.GetGenericTypeDefinition();

            Assert.IsTrue(type.IsNullable);
            Assert.AreEqual("Sample", type.Namespace);
            Assert.AreEqual("Sample.GenericValue", type.FullyQualifiedName);
            Assert.AreEqual("String", type.Arguments.Single().Name);
            Assert.AreEqual("GenericValue", genericTypeDefinition.Name);
            Assert.AreEqual("Sample", genericTypeDefinition.Namespace);
            Assert.IsTrue(genericTypeDefinition.IsNullable);
            Assert.AreEqual("T", genericTypeDefinition.Arguments.Single().Name);
        }

        [Test]
        public async Task NullableGenericValueSymbolPreservesContainingTypeAndAccessibility()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: nameof(NullableReferenceGenericTypeDoesNotResolveToNullable));

            var nestedType = GetPropertySymbol(compilation, "Container", "NestedNullableValue").Type.GetCSharpType();
            var internalType = GetPropertySymbol(compilation, "Container", "InternalNullableValue").Type.GetCSharpType();

            Assert.AreEqual("Sample.Outer", nestedType.Namespace);
            Assert.IsNull(nestedType.DeclaringType);
            Assert.AreEqual("Sample.Outer.NestedGenericValue", nestedType.FullyQualifiedName);
            Assert.IsFalse(internalType.IsPublic);
        }

        [Test]
        public async Task NullableStructConstrainedTypeParameterPreservesTypeParameterIdentity()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: nameof(NullableReferenceGenericTypeDoesNotResolveToNullable));
            var propertySymbol = GetPropertySymbol(compilation, "GenericContainer`1", "NullableValue");

            var type = propertySymbol.Type.GetCSharpType();

            Assert.AreEqual("T", type.Name);
            Assert.AreEqual(string.Empty, type.Namespace);
            Assert.IsNull(type.DeclaringType);
            Assert.AreEqual("T", type.FullyQualifiedName);
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
    }
}
