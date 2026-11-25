// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
using Moq;
using Moq.Protected;
using NUnit.Framework;
using NUnit.Framework.Internal;
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

        [TestCase("Values", 1, "global::Sample.ExternalValue[]")]
        [TestCase("Matrix", 2, "global::Sample.ExternalValue[,]")]
        [TestCase("Jagged", 1, "global::Sample.ExternalValue[][]")]
        [TestCase("Groups", 1, "global::System.Collections.Generic.List<global::Sample.ExternalValue>[]")]
        [TestCase("VectorOfMatrices", 1, "global::Sample.ExternalValue[][,]")]
        [TestCase("MatrixOfVectors", 2, "global::Sample.ExternalValue[,][]")]
        public async Task SymbolBackedArraysRetainElementAndRank(string propertyName, int rank, string expected)
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var symbol = GetPropertySymbol(compilation, "Container", propertyName);
            var array = symbol.Type.GetCSharpType();
            Assert.That(array.IsArray, Is.True);
            Assert.That(array.ArrayRank, Is.EqualTo(rank));
            Assert.That(array.ToString(), Is.EqualTo(expected));
            if (propertyName == "Jagged")
            {
                Assert.That(array.ElementType.IsArray, Is.True);
                Assert.That(array.ElementType.ElementType.Name, Is.EqualTo("ExternalValue"));
            }
        }

        private static IPropertySymbol GetPropertySymbol(Compilation compilation, string containerName, string propertyName)
        {
            var typeSymbol = compilation.GetTypeByMetadataName($"Sample.{containerName}");
            Assert.IsNotNull(typeSymbol, $"Failed to resolve 'Sample.{containerName}' type symbol from compiled source.");
            var propertySymbol = typeSymbol!.GetMembers(propertyName).OfType<IPropertySymbol>().FirstOrDefault();
            Assert.IsNotNull(propertySymbol, $"Failed to resolve property '{propertyName}'.");
            return propertySymbol!;
        }

        [Test]
        [TestCase("1.0.0", true, "Test.ModelProvider.External", true)]
        [TestCase("1.0.0", false, "Test.ModelProvider.External", true)]
        [TestCase("1.0.0.4", false, "Test.ModelProvider.External", true)]
        [TestCase("1.0.0.4", true, "Test.ModelProvider.External", true)]
        [TestCase("1.0.0", true, "GeneratedCode", false)]
        [TestCase("1.0.0", false, "GeneratedCode", false)]
        [TestCase("1.0.0.4", false, "GeneratedCode", false)]
        [TestCase("1.0.0.4", true, "GeneratedCode", false)]
        public void CreateCSharpType_ExternalTypeNotInFramework(string pkgVersion, bool isAlpha, string pkgName, bool shouldBeFramework)
        {
            // Create a temporary directory for project and cache
            string tempDir = Path.Combine(Path.GetTempPath(), "TestArtifacts", Guid.NewGuid().ToString());
            string nugetCacheDir = Path.Combine(tempDir, "NuGetCache");
            Directory.CreateDirectory(nugetCacheDir);
            // Create an external test package.
            Version assemblyVersion = Version.Parse(pkgVersion);
            string typeName = $"{pkgName}.MyExternalType";
            string fixedPkgVersion = isAlpha ? pkgVersion + "-alpha.20261027.4" : pkgVersion;
            FakeNuGetPackage.Create(
                nugetCacheDir: nugetCacheDir,
                packageName: pkgName,
                version: fixedPkgVersion,
                sourceCode: $"namespace {pkgName} {{ public class MyExternalType {{ public class MyInnerExternalType {{ public class My2InnerExternalType {{}} }} }} }}",
                assemblyVersion: assemblyVersion);
            InputExternalTypeMetadata external = new(typeName, pkgName, null);
            InputModelType model = InputFactory.Model(
                "ModelWithResolvableExternal",
                external: external
            );
            // Make sure we are reading the temporary NuGetCache.
            string ns = "TestProject";
            try
            {
                MockHelpers.LoadMockGenerator(
                    inputNamespaceName: ns,
                    outputPath: Path.Combine(tempDir, "ProjectDir"),
                    inputModelTypes: [model],
                    configuration: $"{{\"package-name\": \"{ns}\"}}");
                string dllPath = Path.Combine(nugetCacheDir, pkgName.ToLowerInvariant(), fixedPkgVersion, "lib", "netstandard2.0", $"{pkgName}.dll");
                CodeModelGenerator.Instance.AddMetadataReference(
                        MetadataReference.CreateFromFile(dllPath));
                MetadataReference myExternalRef = MetadataReference.CreateFromFile(dllPath);
                CSharpCompilation compilation = CSharpCompilation.Create(
                    assemblyName: pkgName,
                    references: [myExternalRef]
                );
                // Load the assembly.
                IAssemblySymbol? testAssembly = (IAssemblySymbol?)compilation.GetAssemblyOrModuleSymbol(myExternalRef);
                Assert.That(testAssembly, Is.Not.Null);
                if(pkgVersion.Length == 5)
                {
                    Version correctedVersion = new(pkgVersion + ".0");
                    Assert.That(testAssembly?.Identity.Version, Is.EqualTo(correctedVersion));
                }
                else
                {
                    Assert.That(testAssembly?.Identity.Version, Is.EqualTo(assemblyVersion));
                }
                // Run the tests.
                AssertFramework(testAssembly, typeName, shouldBeFramework);
                AssertFramework(testAssembly, $"{pkgName}.MyExternalType+MyInnerExternalType", shouldBeFramework);
                AssertFramework(testAssembly, $"{pkgName}.MyExternalType+MyInnerExternalType+My2InnerExternalType", shouldBeFramework);
            }
            finally
            {
                ExternalTypeReferenceResolver.Reset();
                Directory.Delete(tempDir, true);
            }
        }

        [Test]
        public void CreateCSharpType_ExternalEnumNotInFramework()
        {
            // Create a temporary directory for project and cache
            string tempDir = Path.Combine(Path.GetTempPath(), "TestArtifacts", Guid.NewGuid().ToString());
            string nugetCacheDir = Path.Combine(tempDir, "NuGetCache");
            Directory.CreateDirectory(nugetCacheDir);
            // Create an external test package.
            const string pkgName = "Test.ModelProvider.External";
            string typeName = $"{pkgName}.MyEnumType";
            const string pkgVersion = "1.0.0";
            Version assemblyVersion = Version.Parse(pkgVersion);
            FakeNuGetPackage.Create(
                nugetCacheDir: nugetCacheDir,
                packageName: pkgName,
                version: pkgVersion,
                sourceCode: File.ReadAllText(Helpers.GetAssetFileOrDirectoryPath(true)),
                assemblyVersion: assemblyVersion);
            InputExternalTypeMetadata external = new(typeName, pkgName, null);
            InputModelType model = InputFactory.Model(
                "ModelWithResolvableExternal",
                external: external
            );
            // Make sure we are reading the temporary NuGetCache.
            string ns = "TestProject";
            try
            {
                MockHelpers.LoadMockGenerator(
                    inputNamespaceName: ns,
                    outputPath: Path.Combine(tempDir, "ProjectDir"),
                    inputModelTypes: [model],
                    configuration: $"{{\"package-name\": \"{ns}\"}}");
                string dllPath = Path.Combine(nugetCacheDir, pkgName.ToLowerInvariant(), pkgVersion, "lib", "netstandard2.0", $"{pkgName}.dll");
                CodeModelGenerator.Instance.AddMetadataReference(
                        MetadataReference.CreateFromFile(dllPath));
                MetadataReference myExternalRef = MetadataReference.CreateFromFile(dllPath);
                CSharpCompilation compilation = CSharpCompilation.Create(
                    assemblyName: pkgName,
                    references: [myExternalRef]
                );
                // Load the assembly.
                IAssemblySymbol? testAssembly = (IAssemblySymbol?)compilation.GetAssemblyOrModuleSymbol(myExternalRef);
                Assert.That(testAssembly, Is.Not.Null);
                Version correctedVersion = new(pkgVersion + ".0");
                Assert.That(testAssembly?.Identity.Version, Is.EqualTo(correctedVersion));
                // Sanity check that we do have a symbol.
                INamedTypeSymbol? typeReflection = testAssembly?.GetTypeByMetadataName(typeName);
                Assert.That(typeReflection, Is.Not.Null);
                CSharpType? typespecType = typeReflection?.GetCSharpType();
                Assert.That(typespecType, Is.Not.Null);
                Assert.That(typespecType?.IsFrameworkType, Is.True);
                Assert.That(typespecType?.IsEnum, Is.True);
            }
            finally
            {
                ExternalTypeReferenceResolver.Reset();
                Directory.Delete(tempDir, true);
            }
        }

        private static void AssertFramework(IAssemblySymbol? testAssembly, string symbolName, bool shouldBeFramework)
        {
            // Sanity check that we do have a symbol.
            INamedTypeSymbol? typeReflection = testAssembly?.GetTypeByMetadataName(symbolName);
            Assert.That(typeReflection, Is.Not.Null);
            // Check is we return the right class.
            CSharpType? typespecType = typeReflection?.GetCSharpType();
            Assert.That(typespecType, Is.Not.Null);
            Assert.That(typespecType?.IsFrameworkType, Is.EqualTo(shouldBeFramework));
            Assert.That(typespecType?.IsEnum, Is.False);
        }
    }
}
