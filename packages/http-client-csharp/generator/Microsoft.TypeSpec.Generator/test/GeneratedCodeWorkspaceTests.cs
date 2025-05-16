// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class GeneratedCodeWorkspaceTests
    {
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

            CreateTestAssemblyAndProjectFile(nugetCacheDir);

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
        [Test]
        public async Task TestLoadBaselineContractLoadsTypeSuccessfully()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                inputNamespaceName: "TestNamespace",
                outputPath: _projectDir,
                includeXmlDocs: true);
            var compilation = await GeneratedCodeWorkspace.LoadBaselineContract();
            Assert.NotNull(compilation, "Compilation should not be null");

            // Validate the loaded type
            var testType = compilation!.GetTypeByMetadataName("TestNamespace.SimpleType");
            Assert.NotNull(testType, "SimpleType should be found in the compilation");
            Assert.AreEqual("SimpleType", testType!.Name);
            Assert.AreEqual("TestNamespace", testType.ContainingNamespace.Name);
            var fooMethod = testType.GetMembers("Foo").OfType<IMethodSymbol>().FirstOrDefault();
            Assert.NotNull(fooMethod, "Foo method should be found in the SimpleType");
        }

        private void CreateTestAssemblyAndProjectFile(string nugetCacheDir)
        {
            var syntaxTree = CSharpSyntaxTree.ParseText(@"
namespace TestNamespace
{
    /// <summary>
    /// This is a simple test type.
    /// </summary>
    public class SimpleType
    {
        /// <summary>
        /// A test property.
        /// </summary>
        public string Name { get; set; }

        public void Foo(string p1) { }
    }
}");

            var references = new[]
            {
                MetadataReference.CreateFromFile(typeof(object).Assembly.Location)
            };

            // Copy the project file to the temp test directory
            const string version = "1.0.0";
            var projectFilePath = Path.Combine(Helpers.GetAssetFileOrDirectoryPath(false), "TestNamespace.csproj");
            if (!File.Exists(projectFilePath))
            {
                Assert.Fail($"Test project file not found: {projectFilePath}");
            }
            var projectRoot = ProjectRootElement.Open(projectFilePath);
            if (projectRoot == null)
            {
                Assert.Fail("Failed to open test project file.");
            }

            var csProjDestination = Path.Combine(_projectDir!, "src", "TestNamespace.csproj");
            projectRoot!.Save(csProjDestination);

            var compilation = CSharpCompilation.Create(
                "TestNamespace",
                [syntaxTree],
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            var nugetPackageDir = Path.Combine(nugetCacheDir, "testnamespace", version, "lib", "netstandard2.0");
            Directory.CreateDirectory(nugetPackageDir);

            var dllPath = Path.Combine(nugetPackageDir, "TestNamespace.dll");
            var emitResult = compilation.Emit(dllPath);
            Assert.IsTrue(emitResult.Success, $"Failed to emit test assembly: ${string.Join(", ", emitResult.Diagnostics)}");
        }
    }
}
