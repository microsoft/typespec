// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class GeneratedCodeWorkspaceTests
    {
        private const string EvaluatedFrameworkTestCategory = "WithEvaluatedFrameworkValue";
        private const string UnevaluatedFrameworkTestCategory = "WithUnevaludatedFrameworkValue";
        private string? _tempDirectory;
        private string? _projectDir;
        private string? _originalNugetPackageDir;

        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();

            // Create temporary directory for test artifacts
            _tempDirectory = Path.Combine(Path.GetTempPath(), "TestArtifacts", Guid.NewGuid().ToString());
            _projectDir = Path.Combine(_tempDirectory, "ProjectDir");
            var nugetCacheDir = Path.Combine(_tempDirectory, "NuGetCache");
            Directory.CreateDirectory(Path.Combine(_projectDir, "src"));
            Directory.CreateDirectory(nugetCacheDir);

            var categories = TestContext.CurrentContext.Test?.Properties["Category"];
            bool isUnevaluatedFrameworkCategory = categories?.Contains(UnevaluatedFrameworkTestCategory) ?? false;

            var csProjectFileName = isUnevaluatedFrameworkCategory
                ? "TestNamespaceUnevaluatedFrameworkValue.csproj"
                : "TestNamespace.csproj";
            CreateTestAssemblyAndProjectFile(nugetCacheDir, csProjectFileName);

            _originalNugetPackageDir = Environment.GetEnvironmentVariable("NUGET_PACKAGES", EnvironmentVariableTarget.Process);
            Environment.SetEnvironmentVariable("NUGET_PACKAGES", nugetCacheDir, EnvironmentVariableTarget.Process);
        }

        [TearDown]
        public void Cleanup()
        {
            Directory.Delete(_tempDirectory!, true);
            if (_originalNugetPackageDir != null)
            {
                Environment.SetEnvironmentVariable("NUGET_PACKAGES", _originalNugetPackageDir, EnvironmentVariableTarget.Process);
            }
        }

        // This test validates that the baseline contract loads successfully from a assembly.
        [TestCase(Category = EvaluatedFrameworkTestCategory)]
        public async Task TestLoadBaselineContractLoadsTypeSuccessfully()
        {
            var ns = "TestNamespace";
            await MockHelpers.LoadMockGeneratorAsync(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                includeXmlDocs: true);
            var compilation = await GeneratedCodeWorkspace.LoadBaselineContract();
            Assert.NotNull(compilation, "Compilation should not be null");

            // Validate the loaded type
            var testType = compilation!.GetTypeByMetadataName($"{ns}.SimpleType");
            Assert.NotNull(testType, "SimpleType should be found in the compilation");
            Assert.AreEqual("SimpleType", testType!.Name);
            Assert.AreEqual(ns, testType.ContainingNamespace.Name);
            var fooMethod = testType.GetMembers("Foo").OfType<IMethodSymbol>().FirstOrDefault();
            Assert.NotNull(fooMethod, "Foo method should be found in the SimpleType");
        }

        [TestCase(Category = UnevaluatedFrameworkTestCategory)]
        public async Task TestLoadBaselineContractLoadsTypeSuccessfully_UnevaluatedTargetFrameworks()
        {
            var ns = "TestNamespaceUnevaluatedFrameworkValue";
            await MockHelpers.LoadMockGeneratorAsync(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                includeXmlDocs: true);
            var compilation = await GeneratedCodeWorkspace.LoadBaselineContract();
            Assert.NotNull(compilation, "Compilation should not be null");

            // Validate the loaded type
            var testType = compilation!.GetTypeByMetadataName($"{ns}.SimpleType");
            Assert.NotNull(testType, "SimpleType should be found in the compilation");
            Assert.AreEqual("SimpleType", testType!.Name);
            Assert.AreEqual(ns, testType.ContainingNamespace.Name);
            var fooMethod = testType.GetMembers("Foo").OfType<IMethodSymbol>().FirstOrDefault();
            Assert.NotNull(fooMethod, "Foo method should be found in the SimpleType");
        }

        [TestCase(Category = EvaluatedFrameworkTestCategory)]
        public async Task TestLoadBaselineContractUsesPackageNameWhenNamespaceDiffers()
        {
            const string ns = "Service.Namespace";
            const string packageName = "Service.Package";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            CreateTestAssemblyAndProjectFile(
                nugetCacheDir,
                "TestNamespace.csproj",
                packageName,
                ns,
                $"{packageName}.csproj");

            await MockHelpers.LoadMockGeneratorAsync(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{packageName}\"}}");

            var compilation = await GeneratedCodeWorkspace.LoadBaselineContract();

            Assert.NotNull(compilation, "Compilation should not be null");
            Assert.NotNull(compilation!.GetTypeByMetadataName($"{ns}.SimpleType"));
        }

        [Test]
        public async Task AddPackageReferencesFromProject_AddsReferencesFromCsproj()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");

            // Create a fake external package assembly in the NuGet cache
            var externalPkgName = "My.External.Library";
            var externalPkgVersion = "2.0.0";
            var externalPkgDir = Path.Combine(
                nugetCacheDir, externalPkgName.ToLowerInvariant(), externalPkgVersion, "lib", "netstandard2.0");
            Directory.CreateDirectory(externalPkgDir);

            var externalSyntaxTree = CSharpSyntaxTree.ParseText(@"
namespace My.External.Library
{
    public class ExternalCredential { }
}");
            var externalCompilation = CSharpCompilation.Create(
                externalPkgName,
                [externalSyntaxTree],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var externalDllPath = Path.Combine(externalPkgDir, $"{externalPkgName}.dll");
            var emitResult = externalCompilation.Emit(externalDllPath);
            Assert.IsTrue(emitResult.Success, "Failed to emit external test assembly");

            // Create a .csproj with a PackageReference to the external package
            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""{externalPkgName}"">
      <Version>{externalPkgVersion}</Version>
    </PackageReference>
  </ItemGroup>
</Project>";
            var csProjPath = Path.Combine(_projectDir!, "src", $"{ns}.csproj");
            File.WriteAllText(csProjPath, csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();
            var refCountAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;

            Assert.AreEqual(refCountBefore + 1, refCountAfter, "Should have added one metadata reference");
        }

        [Test]
        public async Task AddPackageReferencesFromProject_SkipsWhenNoCsproj()
        {
            // Use a namespace that doesn't match any .csproj in the project dir
            MockHelpers.LoadMockGenerator(
                inputNamespaceName: "NonExistentNamespace",
                outputPath: _projectDir,
                configuration: "{\"package-name\": \"NonExistentNamespace\"}");

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();
            var refCountAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;

            Assert.AreEqual(refCountBefore, refCountAfter, "Should not add references when no .csproj exists");
        }

        [Test]
        public async Task AddPackageReferencesFromProject_SkipsPackageNotInCache()
        {
            var ns = "TestNamespace";

            // Create a .csproj referencing a package that doesn't exist in
            // the cache or on any NuGet feed — should gracefully skip it.
            var csprojContent = @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""Some.Missing.Package"">
      <Version>1.0.0</Version>
    </PackageReference>
  </ItemGroup>
</Project>";
            var csProjPath = Path.Combine(_projectDir!, "src", $"{ns}.csproj");
            File.WriteAllText(csProjPath, csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();
            var refCountAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;

            Assert.AreEqual(refCountBefore, refCountAfter, "Should not add references for packages not in cache");
        }

        [Test]
        public async Task AddPackageReferencesFromProject_ResolvesPackageWithNoVersion()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");

            // Create a fake package in the cache (simulating a centrally managed package)
            var externalPkgName = "Centrally.Managed.Package";
            CreateFakeNuGetPackage(nugetCacheDir, externalPkgName, "4.2.0");

            // Create a .csproj with no Version on the PackageReference
            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""{externalPkgName}"" />
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();
            var refCountAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;

            Assert.AreEqual(refCountBefore + 1, refCountAfter,
                "Should resolve package from cache even without a version (centrally managed)");
        }

        [Test]
        public async Task AddPackageReferencesFromProject_SkipsAlreadyAddedReferences()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");

            // Create a fake external package assembly in the NuGet cache
            var externalPkgName = "Already.Added.Package";
            var externalPkgVersion = "1.0.0";
            var dllPath = CreateFakeNuGetPackage(nugetCacheDir, externalPkgName, externalPkgVersion);

            // Create a .csproj referencing the package
            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""{externalPkgName}"">
      <Version>{externalPkgVersion}</Version>
    </PackageReference>
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            // Pre-add the reference (simulating a plugin that already added it)
            CodeModelGenerator.Instance.AddMetadataReference(
                MetadataReference.CreateFromFile(dllPath));

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();
            var refCountAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;

            Assert.AreEqual(refCountBefore, refCountAfter,
                "Should not add duplicate reference for a package already in AdditionalMetadataReferences");
        }

        [Test]
        [TestCase(true, true)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(false, false)]
        public async Task AddPackageReferencesFromProject_AddsMultiplePackageReferences(bool badPackage, bool addExtraVersions)
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");

            // Create two fake packages in the cache
            if (!badPackage)
            {
                CreateFakeNuGetPackage(nugetCacheDir, "First.Package", "1.0.0");
            }
            CreateFakeNuGetPackage(nugetCacheDir, "Second.Package", "3.5.0");
            if (addExtraVersions)
            {
                // Add two versions, one newer, one older.
                CreateFakeNuGetPackage(nugetCacheDir, "Second.Package", "3.4.0");
                CreateFakeNuGetPackage(nugetCacheDir, "Second.Package", "3.6.0");
            }

            var csprojContent = @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""First.Package"">
      <Version>1.0.0</Version>
    </PackageReference>
    <PackageReference Include=""Second.Package"">
      <Version>3.5.0</Version>
    </PackageReference>
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();
            var refCountAfter = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            // Extreact versions and packages; make sure there is only one version.
            Dictionary<string, string> packages = [];
            // Dislply is a dll path C:\Users\%susername%\AppData\Local\Temp\TestArtifacts\%guid%\NuGetCache\first.package\1.0.0\lib\netstandard2.0\First.Package.dll
            // Get just {first.package, 1.0.0, lib, netstandard2.0, First.Package.dll}
            // Parse as Tuple: (Name: first.package, Version: 1.0.0, TargetFramework: netstandard2.0)
            IEnumerable<(string Name, string Version, string TargetFramework)> resolvedPackages = CodeModelGenerator.Instance.AdditionalMetadataReferences
                .Where(x => x.Properties.Kind == MetadataImageKind.Assembly && x.Display is not null && x.Display.Contains("NuGetCache"))
                .Select(x => x.Display ?? "")
                .Select(x => x.Substring(x.IndexOf("NuGetCache") + "NuGetCache".Length + 1).Split(Path.DirectorySeparatorChar))
                .Where(x => x?.Length == 5)
                .Select(x => (Name: x[0], Version: x[1], TargetFramework: x[3]));
            foreach (var resolvedPackage in resolvedPackages)
            {
                Assert.That(resolvedPackage.TargetFramework, Is.EqualTo("netstandard2.0"));
                if(packages.TryGetValue(resolvedPackage.Name, out string? version))
                {
                    Assert.Fail($"Found more then one versions for package {resolvedPackage.Name}: {version} and {resolvedPackage.Version}");
                }
                packages[resolvedPackage.Name] = resolvedPackage.Version;
            }
            if (badPackage)
            {
                Assert.AreEqual(refCountBefore + 1, refCountAfter, "Should have added one metadata reference as the second one was intentionally broken");
                AssertPackageVersion(packages, "Second.Package", "3.5.0");
                Assert.That(packages, Does.Not.ContainKey("first.package"));
            }
            else
            {
                Assert.AreEqual(refCountBefore + 2, refCountAfter, "Should have added two metadata references");
                AssertPackageVersion(packages, "First.Package", "1.0.0");
                AssertPackageVersion(packages, "Second.Package", "3.5.0");
            }
        }

        [Test]
        [TestCase(true, true)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        public async Task TestGetLatestFramework(bool includeGoodVersions, bool includeBadVersions)
        {
            string[] good = { "net10.0", "net462", "net8.0", "net9.0" };
            string[] bad = { "Michelangelo", "Leonardo", "Raphael", "Donatello" };
            List<string> frameworks = [];
            for (int i = 0; i < 4; i++)
            {
                if (includeGoodVersions)
                {
                    frameworks.Add(good[i]);
                }
                if (includeBadVersions)
                {
                    frameworks.Add(bad[i]);
                }
            }
            if (includeGoodVersions)
            {
                Assert.That(GeneratedCodeWorkspace.GetLatestTargetFramework(frameworks), Is.EqualTo("net10.0"));
            }
            else
            {
                Assert.That(GeneratedCodeWorkspace.GetLatestTargetFramework(frameworks), Is.EqualTo("Donatello"));
            }
        }

        private static void AssertPackageVersion(IDictionary<string, string> resolvedPackages, string package, string version)
        {
            package = package.ToLower();
            Assert.That(resolvedPackages, Does.ContainKey(package), $"The package {package} was not resolved.");
            Assert.That(resolvedPackages[package], Is.EqualTo(version));
        }

        [Test]
        [TestCase(new string[]{ "net10.0", "net8.0", "net9.0" }, "net10.0")]
        [TestCase(new string[] { "net.10.0", "net.8.0", "net9.0" }, "net.10.0")]
        [TestCase(new string[] { "net10.0", "net.8.0", "net9.0" }, "net10.0")]
        [TestCase(new string[] { "netstandard2.0", "netstandard1.0", "netstandard3.11", "netstandard3.10" }, "netstandard3.11")]
        [TestCase(new string[] { "netstandard.2.0", "netstandard1.0", "netstandard3.11", "netstandard3.10" }, "netstandard3.11")]
        [TestCase(new string[] { "netstandard2.0", "netstandard1.0", "netstandard.3.11", "netstandard3.10" }, "netstandard.3.11")]
        [TestCase(new string[] { "netstandard2.0", "netstandard1.0", "netstandard3.11", "net462" }, "net462")]
        [TestCase(new string[] { "net9.0", "netstandard2.0", "netstandard1.0", "netstandard3.11" }, "net9.0")]
        public async Task TestGetLatestFrameworkDifferentNames(string[] frameworks, string expected)
        {
            Assert.That(GeneratedCodeWorkspace.GetLatestTargetFramework(frameworks), Is.EqualTo(expected));
        }

        [Test]
        [TestCase(true)]
        [TestCase(false)]
        public async Task TestReadProjectAssetsMayBe(bool isSdkFramework)
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            var csprojContent = @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0,net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""First.Package"">
      <Version>1.0.0</Version>
    </PackageReference>
    <PackageReference Include=""Second.Package"">
      <Version>3.5.0</Version>
    </PackageReference>
  </ItemGroup>
</Project>";
            string minimalProjectAssets = """
            {
              "version": 4,
              "targets": {},
              "projectFileDependencyGroups": {
                "netstandard2.0": [
                  "First.Package >= 1.0.0",
                  "Second.Package >= 3.5.0"
                ],
                "net462": [
                  "First.Package >= 1.0.0",
                  "Second.Package >= 3.5.0"
                ],
                "net10.0": [
                  "First.Package >= 1.0.0",
                  "Second.Package >= 3.5.0"
                ]
              }
            }
            """;

            string projectDir;
            if (isSdkFramework)
            {
                Assert.That(_tempDirectory, Is.Not.Null.And.Not.Empty);
                Directory.CreateDirectory(Path.Combine(_tempDirectory!, "sdk"));
                Directory.CreateDirectory(Path.Combine(_tempDirectory!, "sdk", "mysvc"));
                projectDir = Path.Combine(_tempDirectory!, "sdk", "mysvc", "ProjectDir");
                Directory.CreateDirectory(projectDir);
                Directory.CreateDirectory(Path.Combine(projectDir, "src"));
                Directory.CreateDirectory(Path.Combine(_tempDirectory!, "artifacts"));
                Directory.CreateDirectory(Path.Combine(_tempDirectory!, "artifacts", "obj"));
                Directory.CreateDirectory(Path.Combine(_tempDirectory!, "artifacts", "obj", ns));
                File.WriteAllText(Path.Combine(_tempDirectory!, "artifacts", "obj", ns, "project.assets.json"), minimalProjectAssets);
            }
            else
            {
                Assert.That(_projectDir, Is.Not.Null.And.Not.Empty);
                projectDir = _projectDir ?? "";
                Directory.CreateDirectory(Path.Combine(projectDir, "src"));
                Directory.CreateDirectory(Path.Combine(projectDir, "src", "obj"));
                File.WriteAllText(Path.Combine(projectDir, "src", "obj", "project.assets.json"), minimalProjectAssets);
            }
            File.WriteAllText(Path.Combine(projectDir, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");
            Dictionary<string, Dictionary<string, string>> dtFrameworks = GeneratedCodeWorkspace.ReadProjectAssetsMayBe();
            Assert.That(dtFrameworks, Has.Count.EqualTo(3));
            foreach (string framework in new string[]{ "netstandard2.0", "net10.0", "net462" })
            {
                if(dtFrameworks.TryGetValue(framework, out Dictionary<string, string>? dtPackages))
                {
                    Assert.That(dtPackages, Has.Count.EqualTo(2));
                    AssertPackageVersion(dtPackages, "First.Package", "1.0.0");
                    AssertPackageVersion(dtPackages, "Second.Package", "3.5.0");
                }
                else
                {
                    Assert.Fail($"No information on Framework {framework} was found.");
                }
            }
        }

        [Test]
        public async Task TestReadProjectAssetsMayBeNoFile()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            var csprojContent = @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0,net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""First.Package"">
      <Version>1.0.0</Version>
    </PackageReference>
    <PackageReference Include=""Second.Package"">
      <Version>3.5.0</Version>
    </PackageReference>
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");
            Dictionary<string, Dictionary<string, string>> dtFrameworks = GeneratedCodeWorkspace.ReadProjectAssetsMayBe();
            Assert.That(dtFrameworks, Has.Count.EqualTo(0));
        }

        [Test]
        public async Task TestReadProjectAssetsMayBeUnsupportedPackageNames()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            var csprojContent = @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0,net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""First.Package"">
      <Version>1.0.0</Version>
    </PackageReference>
    <PackageReference Include=""Second.Package"">
      <Version>3.5.0</Version>
    </PackageReference>
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);
            string minimalProjectAssets = """
            {
              "version": 4,
              "targets": {},
              "projectFileDependencyGroups": {
                "netstandard2.0": [
                  "First.Package >= 1.0.0",
                  "Second.Package"
                ],
                "net462": [
                  "First.Package >= 1.1.0",
                  "Second.Package == 3.5.0"
                ],
                "net10.0": [
                  "First.Package >= 1.2.0",
                  "Second.Package < 3.5.0"
                ]
              }
            }
            """;
            Directory.CreateDirectory(Path.Combine(_projectDir!, "src", "obj"));
            File.WriteAllText(Path.Combine(_projectDir!, "src", "obj", "project.assets.json"), minimalProjectAssets);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");
            Dictionary<string, Dictionary<string, string>> dtFrameworks = GeneratedCodeWorkspace.ReadProjectAssetsMayBe();
            Assert.That(dtFrameworks, Has.Count.EqualTo(3));
            foreach (string framework in new string[] { "netstandard2.0", "net10.0", "net462" })
            {
                string version = framework switch
                {
                    "netstandard2.0" => "1.0.0",
                    "net462" => "1.1.0",
                    "net10.0" => "1.2.0",
                    _ => throw new InvalidOperationException($"Invalid value {framework}")
                };
                if (dtFrameworks.TryGetValue(framework, out Dictionary<string, string>? dtPackages))
                {
                    Assert.That(dtPackages, Has.Count.EqualTo(1));
                    AssertPackageVersion(dtPackages, "First.Package", version);
                }
                else
                {
                    Assert.Fail($"No information on Framework {framework} was found.");
                }
            }
        }

        /// <summary>
        /// Creates a fake NuGet package assembly in the given cache directory and returns the DLL path.
        /// </summary>
        private static string CreateFakeNuGetPackage(string nugetCacheDir, string packageName, string version)
        {
            var pkgDir = Path.Combine(
                nugetCacheDir, packageName.ToLowerInvariant(), version, "lib", "netstandard2.0");
            Directory.CreateDirectory(pkgDir);

            var syntaxTree = CSharpSyntaxTree.ParseText($@"
namespace {packageName}
{{
    public class Placeholder {{ }}
}}");
            var compilation = CSharpCompilation.Create(
                packageName,
                [syntaxTree],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            var dllPath = Path.Combine(pkgDir, $"{packageName}.dll");
            var result = compilation.Emit(dllPath);
            string metadataPath = Path.Combine(nugetCacheDir, packageName.ToLowerInvariant(), version);
            File.WriteAllText(Path.Combine(metadataPath, ".nupkg.metadata"),
                """
                {
                    "version": 2,
                    "contentHash": "OPrzAveg9k9KMJ4PmDoWCNlNRDiwpFsTJoo2gRWtO4RnJ9DrJ/7NOSLkNmXWORewNDc+2WVcbEhFJ8exdIzA8A==",
                    "source": "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/package/nuget/v3/index.json"
                }
                """
            );
            //
            File.WriteAllText(Path.Combine(metadataPath, $"{packageName}.nuspec"), $"""
            <?xml version="1.0" encoding="utf-8"?>
            <package xmlns="http://schemas.microsoft.com/packaging/2013/05/nuspec.xsd">
              <metadata>
                <id>{packageName}</id>
                <version>{version}</version>
                <authors>Microsoft</authors>
                <requireLicenseAcceptance>true</requireLicenseAcceptance>
                <license type="expression">MIT</license>
                <licenseUrl>https://licenses.nuget.org/MIT</licenseUrl>
                <icon>azureicon.png</icon>
                <readme>README.md</readme>
                <description>Test</description>
                <copyright>© Microsoft Corporation. All rights reserved.</copyright>
                <tags>{packageName}</tags>
                <dependencies>
                  <group targetFramework="net10.0">
                    <dependency id="Azure.Core" version="1.61.0" exclude="Build,Analyzers" />
                  </group>
                  <group targetFramework="net8.0">
                    <dependency id="Azure.Core" version="1.61.0" exclude="Build,Analyzers" />
                  </group>
                  <group targetFramework=".NETStandard2.0">
                    <dependency id="Azure.Core" version="1.61.0" exclude="Build,Analyzers" />
                  </group>
                </dependencies>
              </metadata>
            </package>
            """);
            Assert.IsTrue(result.Success, $"Failed to emit fake assembly for {packageName}");
            return dllPath;
        }

        private void CreateTestAssemblyAndProjectFile(
            string nugetCacheDir,
            string csProjectFileName,
            string? packageName = null,
            string? namespaceName = null,
            string? destinationProjectFileName = null)
        {
            var ns = namespaceName ?? (csProjectFileName.StartsWith("TestNamespaceUnevaluatedFrameworkValue")
                ? "TestNamespaceUnevaluatedFrameworkValue"
                : "TestNamespace");
            packageName ??= ns;
            destinationProjectFileName ??= csProjectFileName;

            var syntaxTree = CSharpSyntaxTree.ParseText($@"
namespace {ns}
{{
    /// <summary>
    /// This is a simple test type.
    /// </summary>
    public class SimpleType
    {{
        /// <summary>
        /// A test property.
        /// </summary>
        public string Name {{ get; set; }}

        public void Foo(string p1) {{ }}
    }}
}}");

            var references = new[]
            {
                MetadataReference.CreateFromFile(typeof(object).Assembly.Location)
            };

            // Copy the project file to the temp test directory
            const string version = "1.0.0";
            var projectFilePath = Path.Combine(Helpers.GetAssetFileOrDirectoryPath(false), csProjectFileName);
            if (!File.Exists(projectFilePath))
            {
                Assert.Fail($"Test project file not found: {projectFilePath}");
            }
            var projectRoot = ProjectRootElement.Open(projectFilePath);
            if (projectRoot == null)
            {
                Assert.Fail("Failed to open test project file.");
            }

            var csProjDestination = Path.Combine(_projectDir!, "src", destinationProjectFileName);
            projectRoot!.Save(csProjDestination);

            var compilation = CSharpCompilation.Create(
                packageName,
                [syntaxTree],
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            var nugetPackageDir = Path.Combine(nugetCacheDir, packageName.ToLowerInvariant(), version, "lib", "netstandard2.0");
            Directory.CreateDirectory(nugetPackageDir);

            var dllPath = Path.Combine(nugetPackageDir, $"{packageName}.dll");
            var emitResult = compilation.Emit(dllPath);
            Assert.IsTrue(emitResult.Success, $"Failed to emit test assembly: ${string.Join(", ", emitResult.Diagnostics)}");
        }
    }
}
