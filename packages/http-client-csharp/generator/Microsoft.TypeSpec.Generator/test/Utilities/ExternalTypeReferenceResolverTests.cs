// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
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
        public void TryResolve_LoadsTypeFromNuGetCache()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string pkgName = "Test.External.Loadable";
            const string typeName = "Test.External.Loadable.LoadableType";
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, "1.2.3");

            var external = new InputExternalTypeMetadata(typeName, pkgName, null);

            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNotNull(resolved, "Resolver should locate the type in the fake NuGet cache.");
            Assert.AreEqual(typeName, resolved!.FullName);
        }

        [Test]
        public void TryResolve_PrefersHighestCachedVersionAtOrAboveMinVersion()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string pkgName = "Test.MultiVersion.Package";
            const string typeName = "Test.MultiVersion.Package.SomeType";

            // Create three cached versions; MinVersion=2.0.0 must skip 1.0.0 and pick 3.0.0 (highest >= MinVersion).
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, "1.0.0");
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, "2.5.0");
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, "3.0.0");

            var external = new InputExternalTypeMetadata(typeName, pkgName, "2.0.0");
            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNotNull(resolved);
            // The assembly's embedded version should match the highest cached version >= MinVersion.
            var assemblyVersion = resolved!.Assembly.GetName().Version;
            Assert.AreEqual(
                new Version(3, 0, 0, 0),
                assemblyVersion,
                $"Expected 3.0.0 to be selected for MinVersion=2.0.0, but got: {assemblyVersion}");
        }

        [Test]
        public void TryResolve_AddsMetadataReferenceOnce()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string pkgName = "Test.MetadataRef.Package";
            const string typeName = "Test.MetadataRef.Package.RefType";
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, "1.0.0");

            var external = new InputExternalTypeMetadata(typeName, pkgName, null);

            var refsBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            var resolved1 = ExternalTypeReferenceResolver.TryResolve(external);
            var resolved2 = ExternalTypeReferenceResolver.TryResolve(external);
            var refsAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;

            Assert.IsNotNull(resolved1);
            Assert.IsNotNull(resolved2);
            Assert.AreSame(resolved1, resolved2, "Cache should return the same Type for repeated lookups.");
            Assert.AreEqual(
                refsBefore + 1,
                refsAfter,
                "Resolver should add the assembly as a metadata reference exactly once.");
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
            StringAssert.Contains(
                "was not found in the NuGet cache",
                ExternalTypeReferenceResolver.GetFailureReason(external),
                "A missing package should be reported as a missing package.");
        }

        [Test]
        public void TryResolve_ResolvesTypeWhoseBaseTypeLivesInAnotherPackage()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string basePkg = "Test.Dependency.Base";
            const string leafPkg = "Test.Dependent.Leaf";
            const string leafTypeName = "Test.Dependent.Leaf.DerivedFromDependencyType";

            // The base package ships package version 2.0.0 but assembly version 1.0.0.0, mirroring real
            // packages (System.ClientModel 1.14.0 ships assembly version 1.9.0.0). Only its .nuspec says
            // 2.0.0 is the right version to load.
            var baseDll = CreateFakeNuGetPackage(
                nugetCacheDir,
                basePkg,
                "2.0.0",
                template: "DependencyPackageSource",
                assemblyVersion: "1.0.0.0");

            // A decoy at a higher package version that does *not* declare DependencyBaseType. Resolving the
            // dependency from the assembly version in the leaf's reference (1.0.0.0) searches for the
            // highest package at or above 1.0.0 and would land here, leaving the base type unloadable. The
            // test therefore only passes when the dependency is pinned from the .nuspec closure.
            CreateFakeNuGetPackage(nugetCacheDir, basePkg, "3.0.0", assemblyVersion: "1.0.0.0");

            CreateFakeNuGetPackage(
                nugetCacheDir,
                leafPkg,
                "1.0.0",
                template: "DependentPackageSource",
                basePackage: basePkg,
                referencedAssemblyPaths: [baseDll],
                dependencies: [(basePkg, "[2.0.0, )")]);

            var external = new InputExternalTypeMetadata(leafTypeName, leafPkg, "1.0.0");

            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            // Assembly.Load puts the leaf assembly in the default AssemblyLoadContext, which cannot see
            // the dependency package. Without the NuGet probing hook, GetType silently returns null here
            // and the external type gets generated instead of referenced.
            Assert.IsNotNull(
                resolved,
                $"Resolver should load '{leafTypeName}' even though its base type lives in '{basePkg}'. " +
                $"Failure reason: {ExternalTypeReferenceResolver.GetFailureReason(external)}");
            Assert.AreEqual(leafTypeName, resolved!.FullName);

            // The whole point of resolving the dependency is that the type is fully usable afterwards:
            // CSharpType's constructor reads BaseType, IsValueType and IsEnum, all of which throw or
            // misreport when the dependency assembly is unavailable.
            Assert.AreEqual($"{basePkg}.DependencyBaseType", resolved.BaseType?.FullName);
            Assert.IsFalse(resolved.IsValueType);
            Assert.IsNull(ExternalTypeReferenceResolver.GetFailureReason(external));
        }

        [Test]
        public void TryResolve_ReportsFailureReasonWhenTypeMissingFromAssembly()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string pkgName = "Test.MissingType.Package";
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, "1.0.0");

            var external = new InputExternalTypeMetadata($"{pkgName}.NotDeclaredAnywhere", pkgName, null);

            Assert.IsNull(ExternalTypeReferenceResolver.TryResolve(external));
            StringAssert.Contains(
                "does not declare the type",
                ExternalTypeReferenceResolver.GetFailureReason(external),
                "A located-but-unusable assembly must not be reported as a missing package.");
        }

        [Test]
        public async Task ResolveAllAsync_ResolvesExternalTypesFromInputLibrary()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string pkgName = "Test.PreWalk.Package";
            const string typeName = "Test.PreWalk.Package.PreWalkType";
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, "1.0.0");

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

            var refsBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await ExternalTypeReferenceResolver.ResolveAllAsync();

            // The pre-walk should populate the cache and add the metadata reference up-front.
            var resolved = ExternalTypeReferenceResolver.TryResolve(external);
            Assert.IsNotNull(resolved);
            Assert.AreEqual(typeName, resolved!.FullName);
            Assert.AreEqual(
                refsBefore + 1,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Count,
                "Pre-walk should add the metadata reference exactly once.");
        }

        private static string CreateFakeNuGetPackage(
            string nugetCacheDir,
            string packageName,
            string version,
            string template = "PackageSource",
            string? basePackage = null,
            IEnumerable<string>? referencedAssemblyPaths = null,
            string? assemblyVersion = null,
            IEnumerable<(string Id, string VersionRange)>? dependencies = null)
        {
            // Load the source template from TestData and substitute the package name + version. The
            // template embeds an [assembly: AssemblyVersion("$VERSION$")] attribute so tests can verify
            // which dll was loaded by inspecting Assembly.GetName().Version. The assembly version defaults
            // to the package version but can be set independently, because real packages routinely ship an
            // assembly version lower than their package version. Disk + compile + emit are delegated to the
            // shared FakeNuGetPackage helper.
            var source = Helpers.GetExpectedFromFile(method: template)
                .Replace("$PACKAGE$", packageName)
                .Replace("$VERSION$", assemblyVersion ?? version)
                .Replace("$BASEPACKAGE$", basePackage ?? string.Empty);
            return FakeNuGetPackage.Create(
                nugetCacheDir, packageName, version, source, referencedAssemblyPaths, dependencies);
        }
    }
}
