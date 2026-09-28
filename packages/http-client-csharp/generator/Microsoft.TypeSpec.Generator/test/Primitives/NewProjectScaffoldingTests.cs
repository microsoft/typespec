// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Primitives
{
    internal class NewProjectScaffoldingTests
    {
        private string _outputDir = null!;

        [SetUp]
        public void SetUp()
        {
            _outputDir = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
            Directory.CreateDirectory(_outputDir);
            Directory.CreateDirectory(Path.Combine(_outputDir, "src"));

            MockHelpers.LoadMockGenerator(
                outputPath: _outputDir,
                configuration: "{\"package-name\": \"TestPackage\"}");
        }

        [TearDown]
        public void TearDown()
        {
            if (Directory.Exists(_outputDir))
            {
                Directory.Delete(_outputDir, true);
            }
        }

        [Test]
        public async Task Execute_WritesSlnxAndCsprojFiles()
        {
            var scaffolding = new NewProjectScaffolding();
            var result = await scaffolding.Execute();

            Assert.IsTrue(result);
            Assert.IsTrue(File.Exists(Path.Combine(_outputDir, "TestPackage.slnx")));
            Assert.IsTrue(File.Exists(Path.Combine(_outputDir, "src", "TestPackage.csproj")));
            Assert.IsTrue(File.Exists(Path.Combine(_outputDir, "tests", "TestPackage.Tests.csproj")));
        }

        [Test]
        public async Task Execute_WritesTestProjectContent()
        {
            var scaffolding = new NewProjectScaffolding();
            await scaffolding.Execute();

            var project = XDocument.Load(Path.Combine(_outputDir, "tests", "TestPackage.Tests.csproj"));
            Assert.AreEqual("Microsoft.NET.Sdk", project.Root!.Attribute("Sdk")!.Value);
            var properties = project.Root.Element("PropertyGroup")!;
            Assert.AreEqual("net8.0", properties.Element("TargetFramework")!.Value);
            Assert.AreEqual("true", properties.Element("IsTestProject")!.Value);
            Assert.AreEqual("false", properties.Element("IsPackable")!.Value);

            var projectReference = project.Descendants("ProjectReference").Single();
            Assert.AreEqual("../src/TestPackage.csproj", projectReference.Attribute("Include")!.Value);
            CollectionAssert.AreEquivalent(
                new[] { "NUnit", "NUnit3TestAdapter", "Microsoft.NET.Test.Sdk" },
                project.Descendants("PackageReference").Select(p => p.Attribute("Include")!.Value));
            Assert.IsTrue(project.Descendants("PackageReference").All(p => p.Attribute("Version") != null));
            Assert.IsEmpty(project.Descendants("None"));
        }

        [Test]
        public async Task Execute_PreservesExistingTestFiles()
        {
            var testDirectory = Path.Combine(_outputDir, "tests");
            Directory.CreateDirectory(testDirectory);
            var testDataPath = Path.Combine(testDirectory, "TestData.txt");
            await File.WriteAllTextAsync(testDataPath, "existing test data");

            var scaffolding = new NewProjectScaffolding();
            await scaffolding.Execute();

            Assert.AreEqual("existing test data", await File.ReadAllTextAsync(testDataPath));
            Assert.IsTrue(File.Exists(Path.Combine(testDirectory, "TestPackage.Tests.csproj")));
        }

        [Test]
        public async Task Execute_CanRegenerateTestProject()
        {
            var scaffolding = new NewProjectScaffolding();
            await scaffolding.Execute();
            var testProjectPath = Path.Combine(_outputDir, "tests", "TestPackage.Tests.csproj");
            var content = await File.ReadAllTextAsync(testProjectPath);

            await scaffolding.Execute();

            Assert.AreEqual(content, await File.ReadAllTextAsync(testProjectPath));
        }

        [Test]
        public async Task Execute_UsesCustomTestProjectContent()
        {
            var scaffolding = new TestScaffolding();
            await scaffolding.Execute();

            var project = XDocument.Load(Path.Combine(_outputDir, "tests", "TestPackage.Tests.csproj"));
            Assert.AreEqual("net10.0", project.Root!.Element("PropertyGroup")!.Element("TargetFramework")!.Value);
        }

        [Test]
        public async Task Execute_CleansUpOldSlnFiles()
        {
            // Create old .sln file
            var oldSlnPath = Path.Combine(_outputDir, "OldProject.sln");
            await File.WriteAllTextAsync(oldSlnPath, "old content");

            var scaffolding = new NewProjectScaffolding();
            await scaffolding.Execute();

            Assert.IsFalse(File.Exists(oldSlnPath));
        }

        [Test]
        public async Task Execute_CleansUpOldSlnxFiles()
        {
            // Create old .slnx file
            var oldSlnxPath = Path.Combine(_outputDir, "OldProject.slnx");
            await File.WriteAllTextAsync(oldSlnxPath, "old content");

            var scaffolding = new NewProjectScaffolding();
            await scaffolding.Execute();

            Assert.IsFalse(File.Exists(oldSlnxPath));
        }

        [Test]
        public async Task Execute_SlnxUsesForwardSlashes()
        {
            var scaffolding = new NewProjectScaffolding();
            await scaffolding.Execute();

            var slnxPath = Path.Combine(_outputDir, "TestPackage.slnx");
            var content = await File.ReadAllTextAsync(slnxPath);
            Assert.That(content, Does.Contain("src/TestPackage.csproj"));
            Assert.That(content, Does.Not.Contain("src\\TestPackage.csproj"));
            Assert.That(content, Does.Contain("tests/TestPackage.Tests.csproj"));
            Assert.That(content, Does.Not.Contain("tests\\TestPackage.Tests.csproj"));
        }

        [Test]
        public async Task Execute_CallsWriteAdditionalFiles()
        {
            var scaffolding = new TestScaffolding();
            var result = await scaffolding.Execute();

            Assert.IsTrue(result);
            Assert.IsTrue(scaffolding.WriteAdditionalFilesCalled);
        }

        [Test]
        public async Task WriteAdditionalFiles_CanEmitCustomFiles()
        {
            var ciYmlPath = Path.Combine(_outputDir, "ci.yml");
            var scaffolding = new FileWritingScaffolding(ciYmlPath, "name: CI");
            await scaffolding.Execute();

            Assert.IsTrue(File.Exists(ciYmlPath));
            Assert.AreEqual("name: CI", await File.ReadAllTextAsync(ciYmlPath));
        }

        private class TestScaffolding : NewProjectScaffolding
        {
            public bool WriteAdditionalFilesCalled { get; private set; }

            protected override string GetTestProjectFileContent()
            {
                return new CSharpProjectWriter { TargetFramework = "net10.0" }.Write();
            }

            protected override Task WriteAdditionalFiles()
            {
                WriteAdditionalFilesCalled = true;
                return Task.CompletedTask;
            }
        }

        private class FileWritingScaffolding : NewProjectScaffolding
        {
            private readonly string _filePath;
            private readonly string _content;

            public FileWritingScaffolding(string filePath, string content)
            {
                _filePath = filePath;
                _content = content;
            }

            protected override async Task WriteAdditionalFiles()
            {
                await File.WriteAllTextAsync(_filePath, _content);
            }
        }
    }
}
