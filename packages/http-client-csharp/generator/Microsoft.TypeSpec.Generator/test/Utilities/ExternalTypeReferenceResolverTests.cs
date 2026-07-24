// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        public void TryResolve_LoadsTypeFromNuGetCache()
        {
            const string pkgName = "Test.External.Loadable";
            const string typeName = "Test.External.Loadable.LoadableType";
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "1.2.3");

            var external = new InputExternalTypeMetadata(typeName, pkgName, null);

            var resolved = ExternalTypeReferenceResolver.TryResolve(external);

            Assert.IsNotNull(resolved, "Resolver should locate the type in the fake NuGet cache.");
            Assert.AreEqual(typeName, resolved!.FullName);
        }

        [Test]
        public void TryResolve_PrefersHighestCachedVersionAtOrAboveMinVersion()
        {
            const string pkgName = "Test.MultiVersion.Package";
            const string typeName = "Test.MultiVersion.Package.SomeType";

            // Create three cached versions; MinVersion=2.0.0 must skip 1.0.0 and pick 3.0.0 (highest >= MinVersion).
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "1.0.0");
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "2.5.0");
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "3.0.0");

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
            const string pkgName = "Test.MetadataRef.Package";
            const string typeName = "Test.MetadataRef.Package.RefType";
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "1.0.0");

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
        }

        [Test]
        public async Task ResolveAllAsync_ResolvesExternalTypesFromInputLibrary()
        {
            const string pkgName = "Test.PreWalk.Package";
            const string typeName = "Test.PreWalk.Package.PreWalkType";
            CreateFakeNuGetPackage(_nugetCacheDir!, pkgName, "1.0.0");

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
