// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

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
        public async Task AddPackageReferencesFromProject_UsesProjectPackageVersion()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            var packageName = "Versioned.Package";
            var expectedAssemblyPath = CreateFakeNuGetPackage(nugetCacheDir, packageName, "1.0.0");
            CreateFakeNuGetPackage(nugetCacheDir, packageName, "2.0.0");

            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""{packageName}"" Version=""[1.0.0]"" />
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();

            Assert.AreEqual(
                expectedAssemblyPath,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Last().Display,
                "Should register the package version selected by the project");
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

            var externalPkgName = "Centrally.Managed.Package";
            var expectedAssemblyPath = CreateFakeNuGetPackage(nugetCacheDir, externalPkgName, "4.2.0");
            CreateFakeNuGetPackage(nugetCacheDir, externalPkgName, "5.0.0");

            var centralPackageVersions = $@"<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include=""{externalPkgName}"" Version=""4.2.0"" />
  </ItemGroup>
</Project>";
            File.WriteAllText(
                Path.Combine(_projectDir!, "src", "Directory.Packages.props"),
                centralPackageVersions);

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
            Assert.AreEqual(
                expectedAssemblyPath,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Last().Display,
                "Should use the centrally managed package version");
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

        [Test]
        public async Task AddPackageReferencesFromProject_AddsAllPackageAssemblies()
        {
            var ns = "TestNamespace";
            var nugetCacheDir = Path.Combine(_tempDirectory!, "NuGetCache");
            var packageName = "Package.With.Multiple.Assemblies";
            var packageDirectory = Path.GetDirectoryName(
                CreateFakeNuGetPackage(nugetCacheDir, packageName, "1.0.0"))!;

            var supportAssemblyPath = Path.Combine(packageDirectory, "Package.Support.dll");
            var supportCompilation = CSharpCompilation.Create(
                "Package.Support",
                [CSharpSyntaxTree.ParseText("namespace Package.Support { public class SupportType { } }")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var emitResult = supportCompilation.Emit(supportAssemblyPath);
            Assert.IsTrue(emitResult.Success, "Failed to emit support assembly");

            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""{packageName}"" Version=""1.0.0"" />
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();

            Assert.AreEqual(
                refCountBefore + 2,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Count,
                "Should add every assembly from the package's selected framework directory");
        }

        [Test]
        public async Task AddPackageReferencesFromProject_AddsProjectReferences()
        {
            var ns = "TestNamespace";
            var referencedProjectName = "Referenced.Library";
            var referencedProjectDir = Path.Combine(_projectDir!, referencedProjectName);
            var referencedOutputDir = Path.Combine(referencedProjectDir, "bin", "Release", "net8.0");
            Directory.CreateDirectory(referencedOutputDir);

            var referencedProjectPath = Path.Combine(referencedProjectDir, $"{referencedProjectName}.csproj");
            File.WriteAllText(referencedProjectPath, $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFrameworks>net8.0;net9.0</TargetFrameworks>
    <AssemblyName>{referencedProjectName}</AssemblyName>
  </PropertyGroup>
</Project>");

            var referencedSyntaxTree = CSharpSyntaxTree.ParseText(@"
namespace Referenced.Library
{
    public class ExternalType { }
}");
            var referencedCompilation = CSharpCompilation.Create(
                referencedProjectName,
                [referencedSyntaxTree],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var referencedDllPath = Path.Combine(referencedOutputDir, $"{referencedProjectName}.dll");
            var emitResult = referencedCompilation.Emit(referencedDllPath);
            Assert.IsTrue(emitResult.Success, "Failed to emit referenced project assembly");

            var projectReferencePath = Path.GetRelativePath(
                Path.Combine(_projectDir!, "src"),
                referencedProjectPath);
            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include=""{projectReferencePath}"" />
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

            Assert.AreEqual(refCountBefore + 1, refCountAfter, "Should add the project output as a metadata reference");
            Assert.AreEqual(
                referencedDllPath,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Last().Display);

            var alternateType = InputFactory.Model(
                "ExternalType",
                external: new InputExternalTypeMetadata(
                    "Referenced.Library.ExternalType",
                    null,
                    null));
            var resolvedType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(alternateType);

            Assert.IsNotNull(resolvedType, "Should resolve an alternate type from the project reference");
            Assert.IsTrue(resolvedType!.IsFrameworkType);
            Assert.AreEqual("Referenced.Library.ExternalType", resolvedType.FrameworkType.FullName);
        }

        [Test]
        public async Task AddPackageReferencesFromProject_AddsTransitiveProjectReferences()
        {
            var ns = "TestNamespace";
            var dependencyProjectDir = Path.Combine(_projectDir!, "Dependency.Library");
            var referencedProjectDir = Path.Combine(_projectDir!, "Referenced.Library");
            Directory.CreateDirectory(Path.Combine(dependencyProjectDir, "bin", "Release", "net8.0"));
            Directory.CreateDirectory(Path.Combine(referencedProjectDir, "bin", "Release", "net8.0"));

            var dependencyProjectPath = Path.Combine(dependencyProjectDir, "Dependency.Library.csproj");
            File.WriteAllText(dependencyProjectPath, @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>");
            var dependencyDllPath = Path.Combine(
                dependencyProjectDir,
                "bin",
                "Release",
                "net8.0",
                "Dependency.Library.dll");
            var dependencyCompilation = CSharpCompilation.Create(
                "Dependency.Library",
                [CSharpSyntaxTree.ParseText(
                    "namespace Dependency.Library { public class DependencyType { } }")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.IsTrue(dependencyCompilation.Emit(dependencyDllPath).Success);

            var referencedProjectPath = Path.Combine(referencedProjectDir, "Referenced.Library.csproj");
            var dependencyReferencePath = Path.GetRelativePath(referencedProjectDir, dependencyProjectPath);
            File.WriteAllText(referencedProjectPath, $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include=""{dependencyReferencePath}"" />
  </ItemGroup>
</Project>");
            var referencedDllPath = Path.Combine(
                referencedProjectDir,
                "bin",
                "Release",
                "net8.0",
                "Referenced.Library.dll");
            var referencedCompilation = CSharpCompilation.Create(
                "Referenced.Library",
                [CSharpSyntaxTree.ParseText(
                    "namespace Referenced.Library { public class ExternalType : Dependency.Library.DependencyType { } }")],
                [
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(dependencyDllPath)
                ],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.IsTrue(referencedCompilation.Emit(referencedDllPath).Success);

            var projectReferencePath = Path.GetRelativePath(
                Path.Combine(_projectDir!, "src"),
                referencedProjectPath);
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include=""{projectReferencePath}"" />
  </ItemGroup>
</Project>");

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();

            var referenceNames = CodeModelGenerator.Instance.AdditionalMetadataReferences
                .Select(reference => Path.GetFileNameWithoutExtension(reference.Display))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            Assert.That(referenceNames, Does.Contain("Referenced.Library"));
            Assert.That(referenceNames, Does.Contain("Dependency.Library"));

            var resolvedType = ExternalTypeReferenceResolver.TryResolve(
                new InputExternalTypeMetadata("Referenced.Library.ExternalType", null, null));
            Assert.IsNotNull(resolvedType);
            Assert.AreEqual("Dependency.Library.DependencyType", resolvedType!.BaseType!.FullName);
        }

        [Test]
        public async Task AddPackageReferencesFromProject_SkipsUnbuiltProjectReferences()
        {
            var ns = "TestNamespace";
            var referencedProjectDir = Path.Combine(_projectDir!, "MissingOutput.Library");
            Directory.CreateDirectory(referencedProjectDir);

            var referencedProjectPath = Path.Combine(referencedProjectDir, "MissingOutput.Library.csproj");
            File.WriteAllText(referencedProjectPath, @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>");

            var projectReferencePath = Path.GetRelativePath(
                Path.Combine(_projectDir!, "src"),
                referencedProjectPath);
            var csprojContent = $@"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include=""{projectReferencePath}"" />
  </ItemGroup>
</Project>";
            File.WriteAllText(Path.Combine(_projectDir!, "src", $"{ns}.csproj"), csprojContent);

            MockHelpers.LoadMockGenerator(
                inputNamespaceName: ns,
                outputPath: _projectDir,
                configuration: $"{{\"package-name\": \"{ns}\"}}");

            var refCountBefore = CodeModelGenerator.Instance.AdditionalMetadataReferences.Count;
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();

            Assert.AreEqual(
                refCountBefore,
                CodeModelGenerator.Instance.AdditionalMetadataReferences.Count,
                "Should skip project references whose output assembly has not been built");
        }

        [TestCase(@"C:\.nuget\packages\netstandard.library\2.0.3\build\netstandard2.0\ref\netstandard.dll", true)]
        [TestCase(@"C:\.nuget\packages\netstandard.library\2.0.3\lib\netstandard2.0\Custom.dll", false)]
        [TestCase(@"C:\.nuget\packages\system.clientmodel\1.9.0\lib\net8.0\System.ClientModel.dll", false)]
        public void IsFrameworkFacadeReference_IdentifiesNetStandardLibraryFacades(
            string assemblyPath,
            bool expected)
        {
            Assert.AreEqual(expected, GeneratedCodeWorkspace.IsFrameworkFacadeReference(assemblyPath));
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
