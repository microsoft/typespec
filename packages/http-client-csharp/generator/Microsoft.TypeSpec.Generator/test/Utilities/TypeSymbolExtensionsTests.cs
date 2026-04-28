// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using Moq;
using Moq.Protected;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Primitives.CSharpType;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class TypeSymbolExtensionsTests
    {
        private const string SampleStructFullName = "Sample.SampleStruct";

        private const string TestSource = """
            namespace Sample
            {
                public struct SampleStruct { }
                public class Container
                {
                    public SampleStruct NonNullable { get; set; }
                    public SampleStruct? Nullable { get; set; }
                }
            }
            """;

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
        public void NullableValueTypeOfKnownFrameworkTypeResolvesToNullableFrameworkCSharpType()
        {
            // Regression: TypeFactory.CreateFrameworkType resolves known framework types by their
            // bare fully-qualified name (e.g. "Azure.ETag" => typeof(ETag)), but the symbol-derived
            // FQN for a Nullable<T> wraps that name as "System.Nullable`1[[Azure.ETag]]", which no
            // override matches and Type.GetType cannot resolve. Without the Nullable<T> fallback
            // in GetCSharpType, the result was a symbol-based CSharpType (with _type == null) that
            // failed equality against framework-typed CSharpTypes (e.g. typeof(ETag)) used as keys
            // in serialization handler tables.
            var propertySymbol = GetPropertySymbol(TestSource, "Container", "Nullable");

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
        public void NullableValueTypeOfKnownFrameworkTypeMatchesIgnoreNullableComparer()
        {
            var propertySymbol = GetPropertySymbol(TestSource, "Container", "Nullable");

            var csharpType = propertySymbol.Type.GetCSharpType();

            var comparer = new CSharpTypeIgnoreNullableComparer();
            Assert.IsTrue(comparer.Equals(csharpType, new CSharpType(typeof(Guid))));
        }

        [Test]
        public void NonNullableKnownFrameworkTypeResolvesUnchanged()
        {
            var propertySymbol = GetPropertySymbol(TestSource, "Container", "NonNullable");

            var csharpType = propertySymbol.Type.GetCSharpType();

            Assert.IsTrue(csharpType.IsFrameworkType);
            Assert.AreEqual(typeof(Guid), csharpType.FrameworkType);
            Assert.IsFalse(csharpType.IsNullable);
        }

        private static IPropertySymbol GetPropertySymbol(string source, string containerName, string propertyName)
        {
            var syntaxTree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create(
                "TestAssembly",
                [syntaxTree],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            var typeSymbol = compilation.GetTypeByMetadataName($"Sample.{containerName}");
            Assert.IsNotNull(typeSymbol, $"Failed to resolve 'Sample.{containerName}' type symbol from compiled source.");
            var propertySymbol = typeSymbol!.GetMembers(propertyName).OfType<IPropertySymbol>().FirstOrDefault();
            Assert.IsNotNull(propertySymbol, $"Failed to resolve property '{propertyName}'.");
            return propertySymbol!;
        }
    }
}
