// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
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
        private string? _nugetCacheDir;
        private string? _originalNugetPackageDir;

        [SetUp]
        public void Setup()
        {
            _tempDirectory = Path.Combine(Path.GetTempPath(), "TestArtifacts", Guid.NewGuid().ToString());
            _projectDir = Path.Combine(_tempDirectory, "ProjectDir");
            _nugetCacheDir = Path.Combine(_tempDirectory, "NuGetCache");
            Directory.CreateDirectory(Path.Combine(_projectDir, "src"));
            Directory.CreateDirectory(_nugetCacheDir);

            // Ensure these tests are fully isolated from machine/user NuGet settings and never probe
            // external feeds when package lookup falls through to source probing.
            WriteLocalNuGetConfig(_projectDir, _nugetCacheDir);

            _originalNugetPackageDir = Environment.GetEnvironmentVariable("NUGET_PACKAGES", EnvironmentVariableTarget.Process);
            Environment.SetEnvironmentVariable("NUGET_PACKAGES", _nugetCacheDir, EnvironmentVariableTarget.Process);

            ResetResolverIfInitialized();
            MockHelpers.LoadMockGenerator(
                outputPath: _projectDir,
                configuration: "{}");
        }

        [TearDown]
        public void Cleanup()
        {
            ResetResolverIfInitialized();
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
        public async Task TryResolve_LoadsTypeFromNuGetCache()
        {
            const string pkgName = "Test.External.Loadable";
            const string pkgVersion = "1.2.3";
            const string typeName = "Test.External.Loadable.LoadableType";
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, pkgVersion);

            await CreateProjectAndLoadDependencies([pkgName], [pkgVersion]);

            var external = new InputExternalTypeMetadata(typeName, pkgName, null);

            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNotNull(resolved, "Resolver should locate the type in the fake NuGet cache.");
            Assert.AreEqual(typeName, resolved!.FullName);
        }

        [Test]
        public async Task TryResolve_PrefersHighestCachedVersionAtOrAboveMinVersion()
        {
            const string pkgName = "Test.MultiVersion.Package";
            const string typeName = "Test.MultiVersion.Package.SomeType";
            const string highestVersion = "3.0.0";

            // Create three cached versions; MinVersion=2.0.0 must skip 1.0.0 and pick 3.0.0 (highest >= MinVersion).

            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "1.0.0");
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "2.5.0");
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, highestVersion);
            
            await CreateProjectAndLoadDependencies([pkgName], [highestVersion]);
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
        public async Task TryResolve_AddsMetadataReferenceOnce()
        {
            const string pkgName = "Test.MetadataRef.Package";
            const string typeName = "Test.MetadataRef.Package.RefType";
            const string pkgVersion = "1.0.0";
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, pkgVersion);
            await CreateProjectAndLoadDependencies([pkgName], [pkgVersion]);

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
                "Resolver should add the assembly during project load.");
        }

        [Test]
        public async Task TryResolve_ReturnsNullForUnknownPackage()
        {
            var external = new InputExternalTypeMetadata(
                "Some.Unknown.Type",
                "Definitely.Not.A.Real.Package.Anywhere.Test",
                "999.0.0");
            await CreateProjectAndLoadDependencies([], []);
            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNull(resolved);
            StringAssert.Contains(
                "is not present in package dependencies.",
                ExternalTypeReferenceResolver.GetFailureReason(external),
                "A missing package should be reported as a missing package.");
        }

        [Test]
        public async Task TryResolve_ReturnsNullForHigherMinVersion()
        {
            const string pkgName = "My.Package";
            const string typeName = "My.Package.NewType";
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "41.0.0");
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "42.0.0");
            var external = new InputExternalTypeMetadata(
                typeName,
                pkgName,
                "42.0.0");
            await CreateProjectAndLoadDependencies([pkgName], ["41.0.0"]);
            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNull(resolved);
            StringAssert.Contains(
                "minimal version declared in a typespec (>= 42.0.0) is higher then the one defined in project dependencies \"41.0.0\"",
                ExternalTypeReferenceResolver.GetFailureReason(external),
                "A missing package should be reported as a missing package.");
        }

        [Test]
        public async Task TryResolve_ResolvesTypeWhoseBaseTypeLivesInAnotherPackage()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string basePkg = "Test.Dependency.Base";
            const string pkgVersion = "2.0.0";
            const string leafPkg = "Test.Dependent.Leaf";
            const string leafTypeName = "Test.Dependent.Leaf.DerivedFromDependencyType";

            // The base package ships package version 2.0.0 but assembly version 1.0.0.0, mirroring real
            // packages (System.ClientModel 1.14.0 ships assembly version 1.9.0.0). Only its .nuspec says
            // 2.0.0 is the right version to load.
            var baseDll = CreateFakeNuGetPackage(
                nugetCacheDir,
                basePkg,
                pkgVersion,
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
            // All the dependencies, even indirect onees will be present in project.assets.json.
            await CreateProjectAndLoadDependencies([basePkg, leafPkg], [pkgVersion, "1.0.0"]);

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
        public async Task TryResolve_ReportsFailureReasonWhenTypeMissingFromAssembly()
        {
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            const string pkgName = "Test.MissingType.Package";
            const string pkgVersion = "1.0.0";
            CreateFakeNuGetPackage(nugetCacheDir, pkgName, pkgVersion);
            await CreateProjectAndLoadDependencies([pkgName], [pkgVersion]);

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
            const string pkgName = "Test.PreWalk.Package";
            const string pkgVersion = "1.0.0";
            const string typeName = "Test.PreWalk.Package.PreWalkType";
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, pkgVersion);

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

            await CreateProjectAndLoadDependencies([pkgName], [pkgVersion]);

            var refsBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await ExternalTypeReferenceResolver.ResolveAllAsync();

            // The pre-walk should populate the cache and add the metadata reference up-front.
            var resolved = ExternalTypeReferenceResolver.TryResolve(external);
            Assert.IsNotNull(resolved);
            Assert.AreEqual(typeName, resolved!.FullName);
            Assert.AreEqual(
                refsBefore,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Count,
                "The Metadata must be loaded when the package is being loaded.");
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

        private static void WriteLocalNuGetConfig(string projectDir, string nugetCacheDir)
        {
            var nugetConfigPath = Path.Combine(projectDir, "NuGet.Config");
            var normalizedCachePath = nugetCacheDir.Replace("\\", "/");
            var config = $@"<?xml version=""1.0"" encoding=""utf-8""?>
<configuration>
    <packageSources>
        <clear />
        <add key=""local-cache"" value=""{normalizedCachePath}"" />
    </packageSources>
    <disabledPackageSources>
        <clear />
    </disabledPackageSources>
</configuration>";

            File.WriteAllText(nugetConfigPath, config);
        }

        private async Task CreateProjectAndLoadDependencies(string[] packages, string?[] versions)
        {
            Assert.That(packages.Length, Is.EqualTo(versions.Length), "Each package must have a version (it can be null)");
            StringBuilder sbPackagesProject = new();
            StringBuilder sbPackagesAssets = new();
            string tab = "    ";
            for (int i = 0; i< packages.Length; i++)
            {
                sbPackagesProject.Append($"\n  <PackageReference Include=\"{packages[i]}\">\n    <Version>{versions[i]}</Version>\n  </PackageReference>\n");
                sbPackagesAssets.Append($"\n{tab}{tab}\"{packages[i]}\": {{\n{tab}{tab}{tab}\"type\": \"package\",\n{tab}{tab}{tab}\"dependencies\": {{}}\n{tab}{tab}}}\n");
            }
            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0,net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>{sbPackagesProject}</ItemGroup>
</Project>";
            string minimalProjectAssets = $$"""
            {
              "version": 4,
              "targets": {
                  "netstandard2.0": {{{sbPackagesAssets}}
                  },
                  "net10.0": {{{sbPackagesAssets}}
                  }
              }
            }
            """;
            Assert.That(_projectDir, Is.Not.Null.And.Not.Empty);
            Directory.CreateDirectory(Path.Combine(_projectDir!, "src"));
            Directory.CreateDirectory(Path.Combine(_projectDir!, "src", "obj"));
            string ns = "TestProject";
            File.WriteAllText(Path.Combine(_projectDir!, "src", "obj", "project.assets.json"), minimalProjectAssets);
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir!,
                configuration: $"{{\"package-name\": \"{ns}\"}}");
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();
        }

        private static void ResetResolverIfInitialized()
        {
            try
            {
                ExternalTypeReferenceResolver.Reset();
            }
            catch (InvalidOperationException)
            {
                // CodeModelGenerator may not be initialized yet when this fixture runs in isolation.
            }
        }
    }
}
