// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    // Tests in this fixture mutate process-global state (NUGET_PACKAGES env var, the static resolver
    // cache and CodeModelGenerator.Instance), so they must not run in parallel with each other or
    // with any other fixture that touches those globals.
    [NonParallelizable]
    public class ExternalTypeReferenceResolverTests
    {
        private string? _tempDirectory;
        private string? _projectDir;
        private string? _originalNugetPackageDir;

        [SetUp]
        public void Setup()
        {
            _tempDirectory = Path.Combine(Path.GetTempPath(), "TestArtifacts", Guid.NewGuid().ToString());
            _projectDir = Path.Combine(_tempDirectory, "ProjectDir");
            var nugetCacheDir = Path.Combine(_tempDirectory, "NuGetCache");
            Directory.CreateDirectory(Path.Combine(_projectDir, "src"));
            Directory.CreateDirectory(nugetCacheDir);

            _originalNugetPackageDir = Environment.GetEnvironmentVariable("NUGET_PACKAGES", EnvironmentVariableTarget.Process);
            Environment.SetEnvironmentVariable("NUGET_PACKAGES", nugetCacheDir, EnvironmentVariableTarget.Process);

            ExternalTypeReferenceResolver.Reset();
            MockHelpers.LoadMockGenerator(
                outputPath: _projectDir,
                configuration: "{}");
        }

        [TearDown]
        public void Cleanup()
        {
            ExternalTypeReferenceResolver.Reset();
            Directory.Delete(_tempDirectory!, true);
            Environment.SetEnvironmentVariable("NUGET_PACKAGES", _originalNugetPackageDir, EnvironmentVariableTarget.Process);
        }

        [Test]
        public void TryResolve_ReturnsNullForNullExternal()
        {
            Assert.IsNull(ExternalTypeReferenceResolver.TryResolve(null));
        }

        [Test]
        public void TryResolve_ReturnsNullWhenPackageMissing()
        {
            var external = new InputExternalTypeMetadata("Some.Type.Name", null, null);
            Assert.IsNull(ExternalTypeReferenceResolver.TryResolve(external));
        }

        [Test]
        public void TryResolve_LoadsTypeFromRegisteredMetadataReference()
        {
            var referenceDir = Path.Combine(_tempDirectory!, "References");
            const string pkgName = "Test.External.Loadable";
            const string typeName = "Test.External.Loadable.LoadableType";
            var assemblyPath = CreateFakeNuGetPackage(referenceDir, pkgName, "1.2.3");
            CodeModelGenerator.Instance.AddMetadataReference(
                Microsoft.CodeAnalysis.MetadataReference.CreateFromFile(assemblyPath));

            var external = new InputExternalTypeMetadata(typeName, pkgName, null);

            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNotNull(resolved, "Resolver should locate the type in registered metadata references.");
            Assert.AreEqual(typeName, resolved!.FullName);
        }

        [Test]
        public void TryResolve_LoadsDependenciesFromRegisteredMetadataReferences()
        {
            var referenceDir = Path.Combine(_tempDirectory!, "References");
            Directory.CreateDirectory(referenceDir);

            var dependencyPath = Path.Combine(referenceDir, "Test.External.Dependency.dll");
            var dependencyCompilation = CSharpCompilation.Create(
                "Test.External.Dependency",
                [CSharpSyntaxTree.ParseText(
                    "namespace Test.External.Dependency { public class BaseType { } }")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.IsTrue(dependencyCompilation.Emit(dependencyPath).Success);

            const string typeName = "Test.External.Dependent.DerivedType";
            var dependentPath = Path.Combine(referenceDir, "Test.External.Dependent.dll");
            var dependentCompilation = CSharpCompilation.Create(
                "Test.External.Dependent",
                [CSharpSyntaxTree.ParseText(
                    $"namespace Test.External.Dependent {{ public class DerivedType : Test.External.Dependency.BaseType {{ }} }}")],
                [
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(dependencyPath)
                ],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.IsTrue(dependentCompilation.Emit(dependentPath).Success);

            CodeModelGenerator.Instance.AddMetadataReference(MetadataReference.CreateFromFile(dependentPath));
            CodeModelGenerator.Instance.AddMetadataReference(MetadataReference.CreateFromFile(dependencyPath));

            var resolved = ExternalTypeReferenceResolver.TryResolve(
                new InputExternalTypeMetadata(typeName, "Test.External.Dependent", null));

            Assert.IsNotNull(resolved);
            Assert.AreEqual("Test.External.Dependency.BaseType", resolved!.BaseType!.FullName);
        }

        [Test]
        public void TryResolve_UsesRegisteredReferenceWhenPackageMetadataIncludesMinVersion()
        {
            var referenceDir = Path.Combine(_tempDirectory!, "References");
            const string pkgName = "Test.MultiVersion.Package";
            const string typeName = "Test.MultiVersion.Package.SomeType";

            var lowerVersionAssembly = CreateFakeNuGetPackage(referenceDir, pkgName, "1.0.0");
            CodeModelGenerator.Instance.AddMetadataReference(
                Microsoft.CodeAnalysis.MetadataReference.CreateFromFile(lowerVersionAssembly));

            var external = new InputExternalTypeMetadata(typeName, pkgName, "2.0.0");
            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNotNull(resolved);
            var assemblyVersion = resolved!.Assembly.GetName().Version;
            Assert.AreEqual(
                new Version(1, 0, 0, 0),
                assemblyVersion,
                "The project metadata reference should be authoritative over package metadata.");
        }

        [Test]
        public void TryResolve_DoesNotAddDuplicateMetadataReference()
        {
            var referenceDir = Path.Combine(_tempDirectory!, "References");
            const string pkgName = "Test.MetadataRef.Package";
            const string typeName = "Test.MetadataRef.Package.RefType";
            var assemblyPath = CreateFakeNuGetPackage(referenceDir, pkgName, "1.0.0");
            CodeModelGenerator.Instance.AddMetadataReference(
                Microsoft.CodeAnalysis.MetadataReference.CreateFromFile(assemblyPath));

            var external = new InputExternalTypeMetadata(typeName, pkgName, null);

            var refsBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            var resolved1 = ExternalTypeReferenceResolver.TryResolve(external);
            var resolved2 = ExternalTypeReferenceResolver.TryResolve(external);
            var refsAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;

            Assert.IsNotNull(resolved1);
            Assert.IsNotNull(resolved2);
            Assert.AreSame(resolved1, resolved2, "Cache should return the same Type for repeated lookups.");
            Assert.AreEqual(
                refsBefore,
                refsAfter,
                "Resolver should only consume metadata references registered by the project.");
        }

        [Test]
        public void TryResolve_ReturnsNullForUnknownPackage()
        {
            var external = new InputExternalTypeMetadata(
                "Some.Unknown.Type",
                "Definitely.Not.A.Real.Package.Anywhere.Test",
                "999.0.0");

            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNull(resolved);
        }

        [Test]
        public async Task ResolveAllAsync_ResolvesExternalTypesFromInputLibrary()
        {
            var referenceDir = Path.Combine(_tempDirectory!, "References");
            const string pkgName = "Test.PreWalk.Package";
            const string typeName = "Test.PreWalk.Package.PreWalkType";
            var assemblyPath = CreateFakeNuGetPackage(referenceDir, pkgName, "1.0.0");

            var external = new InputExternalTypeMetadata(typeName, pkgName, null);
            var unionWithExternal = InputFactory.Union(
                [InputPrimitiveType.String],
                "ExternalUnion",
                external);
            var model = InputFactory.Model(
                "ContainerModel",
                properties:
                [
                    InputFactory.Property("ext", unionWithExternal),
                ]);

            MockHelpers.LoadMockGenerator(
                outputPath: _projectDir,
                configuration: "{}",
                inputModelTypes: [model]);
            CodeModelGenerator.Instance.AddMetadataReference(
                Microsoft.CodeAnalysis.MetadataReference.CreateFromFile(assemblyPath));

            var refsBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await ExternalTypeReferenceResolver.ResolveAllAsync();

            // The pre-walk should populate the cache from the registered metadata reference.
            var resolved = ExternalTypeReferenceResolver.TryResolve(external);
            Assert.IsNotNull(resolved);
            Assert.AreEqual(typeName, resolved!.FullName);
            Assert.AreEqual(
                refsBefore,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Count,
                "Pre-walk should not add duplicate metadata references.");
        }

        private static string CreateFakeNuGetPackage(string nugetCacheDir, string packageName, string version)
        {
            // Load the source template from TestData and substitute the package name + version. The
            // template embeds an [assembly: AssemblyVersion("$VERSION$")] attribute so tests can verify
            // which dll was loaded by inspecting Assembly.GetName().Version. Disk + compile + emit are
            // delegated to the shared FakeNuGetPackage helper.
            var template = Helpers.GetExpectedFromFile(method: "PackageSource");
            var source = template
                .Replace("$PACKAGE$", packageName)
                .Replace("$VERSION$", version);
            return FakeNuGetPackage.Create(nugetCacheDir, packageName, version, source);
        }
    }
}
