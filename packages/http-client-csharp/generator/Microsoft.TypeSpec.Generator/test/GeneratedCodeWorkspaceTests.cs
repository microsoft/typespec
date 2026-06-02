// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using System;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.TypeSpec.Generator.Tests
{
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
        public async Task AddPackageReferencesFromProject_AddsMultiplePackageReferences()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");

            // Create two fake packages in the cache
            CreateFakeNuGetPackage(nugetCacheDir, "First.Package", "1.0.0");
            CreateFakeNuGetPackage(nugetCacheDir, "Second.Package", "3.5.0");

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

            Assert.AreEqual(refCountBefore + 2, refCountAfter, "Should have added two metadata references");
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
            Assert.IsTrue(result.Success, $"Failed to emit fake assembly for {packageName}");
            return dllPath;
        }

        private void CreateTestAssemblyAndProjectFile(string nugetCacheDir, string csProjectFileName)
        {
            var ns = csProjectFileName.StartsWith("TestNamespaceUnevaluatedFrameworkValue")
                ? "TestNamespaceUnevaluatedFrameworkValue"
                : "TestNamespace";

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

            var csProjDestination = Path.Combine(_projectDir!, "src", csProjectFileName);
            projectRoot!.Save(csProjDestination);

            var compilation = CSharpCompilation.Create(
                ns,
                [syntaxTree],
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            var nugetPackageDir = Path.Combine(nugetCacheDir, ns.ToLowerInvariant(), version, "lib", "netstandard2.0");
            Directory.CreateDirectory(nugetPackageDir);

            var dllPath = Path.Combine(nugetPackageDir, $"{ns}.dll");
            var emitResult = compilation.Emit(dllPath);
            Assert.IsTrue(emitResult.Success, $"Failed to emit test assembly: ${string.Join(", ", emitResult.Diagnostics)}");
        }
    }
}
