// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.PostProcessing
{
    public class PostProcessorTests
    {
        [Test]
        public async Task RemovesInvalidUsings()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            project = project.AddDocument(
                "RemovesInvalidUsings.cs",
                File.ReadAllText(Path.Join(folder, "RemovesInvalidUsings.cs"))).Project;
            project = project.AddDocument(
                "Model.cs",
                File.ReadAllText(Path.Join(folder, "Model.cs"))).Project;
            var postProcessor = new TestPostProcessor("RemovesInvalidUsings.cs");

            var resultProject = await postProcessor.RemoveAsync(project);
            var doc= resultProject.Documents
                .Single(d => d.Name == "RemovesInvalidUsings.cs");
            var root = await doc.GetSyntaxRootAsync();
            var compilation = (CompilationUnitSyntax)root!;

            var typeNames = compilation
                .DescendantNodes()
                .OfType<BaseTypeDeclarationSyntax>()
                .Select(t => t.Identifier.Text)
                .ToList();
            CollectionAssert.Contains(typeNames, "KeepMe");

            var usings = compilation.Usings.Select(u => u.Name!.ToString()).ToList();
            // The invalid using should be removed
            CollectionAssert.DoesNotContain(usings, "Sample.Models");
            CollectionAssert.Contains(usings, "System");
        }


        [Test]
        public async Task DoesNotRemoveValidUsings()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            project = project.AddDocument(
                "DoesNotRemoveValidUsings.cs",
                File.ReadAllText(Path.Join(folder, "DoesNotRemoveValidUsings.cs"))).Project;
            project = project.AddDocument(
                "Model.cs",
                File.ReadAllText(Path.Join(folder, "Model.cs"))).Project;
            var postProcessor = new TestPostProcessor("DoesNotRemoveValidUsings.cs");

            var resultProject = await postProcessor.RemoveAsync(project);
            var doc= resultProject.Documents
                .Single(d => d.Name == "DoesNotRemoveValidUsings.cs");
            var root = await doc.GetSyntaxRootAsync();
            var compilation = (CompilationUnitSyntax)root!;

            var typeNames = compilation
                .DescendantNodes()
                .OfType<BaseTypeDeclarationSyntax>()
                .Select(t => t.Identifier.Text)
                .ToList();
            CollectionAssert.Contains(typeNames, "KeepMe");

            var usings = compilation.Usings.Select(u => u.Name!.ToString()).ToList();
            CollectionAssert.Contains(usings, "Sample.Models");
            CollectionAssert.Contains(usings, "System");
        }

        [Test]
        public async Task RemovesInvalidAttributes()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(ModelReaderWriterBuildableAttribute).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            const string removesInvalidAttributesFileName = "RemovesInvalidAttributes.cs";
            project = project.AddDocument(
                removesInvalidAttributesFileName,
                File.ReadAllText(Path.Join(folder, removesInvalidAttributesFileName))).Project;
            project = project.AddDocument(
                "Model.cs",
                File.ReadAllText(Path.Join(folder, "Model.cs"))).Project;
            project = project.AddDocument(
                "RootClass.cs",
                File.ReadAllText(Path.Join(folder, "RootClass.cs"))).Project;
            var postProcessor = new TestPostProcessor("RootClass.cs", nonRootTypes: ["Sample.KeepMe"]);

            var resultProject = await postProcessor.RemoveAsync(project);
            var doc= resultProject.Documents
                .Single(d => d.Name == removesInvalidAttributesFileName);
            var root = await doc.GetSyntaxRootAsync();
            var compilation = (CompilationUnitSyntax)root!;

            var namespaceDeclaration = compilation
                .DescendantNodes()
                .OfType<NamespaceDeclarationSyntax>()
                .SingleOrDefault(t => t.Name.ToString() == "Sample");
            var output = namespaceDeclaration!.ToString();

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), output, "The output should match the expected content.");
        }

        [Test]
        public async Task RemovesInvalidAttributesAndKeepsValidAttributes()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(ModelReaderWriterBuildableAttribute).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            const string removesInvalidAttributesFileName = "RemovesInvalidAttributesAndKeepsValidAttributes.cs";
            project = project.AddDocument(
                removesInvalidAttributesFileName,
                File.ReadAllText(Path.Join(folder, removesInvalidAttributesFileName))).Project;
            project = project.AddDocument(
                "Model.cs",
                File.ReadAllText(Path.Join(folder, "Model.cs"))).Project;
            project = project.AddDocument(
                "RootClass.cs",
                File.ReadAllText(Path.Join(folder, "RootClass.cs"))).Project;
            var postProcessor = new TestPostProcessor("RootClass.cs", nonRootTypes: ["Sample.KeepMe"]);

            var resultProject = await postProcessor.RemoveAsync(project);
            var doc= resultProject.Documents
                .Single(d => d.Name == removesInvalidAttributesFileName);
            var root = await doc.GetSyntaxRootAsync();
            var compilation = (CompilationUnitSyntax)root!;

            var namespaceDeclaration = compilation
                .DescendantNodes()
                .OfType<NamespaceDeclarationSyntax>()
                .SingleOrDefault(t => t.Name.ToString() == "Sample");
            var output = namespaceDeclaration!.ToString();

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), output, "The output should match the expected content.");
        }

        [Test]
        public async Task RemovesInvalidAttributesAndKeepsValidAttributesNoDocs()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(ModelReaderWriterBuildableAttribute).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            const string removesInvalidAttributesFileName = "RemovesInvalidAttributesAndKeepsValidAttributesNoDocs.cs";
            project = project.AddDocument(
                removesInvalidAttributesFileName,
                File.ReadAllText(Path.Join(folder, removesInvalidAttributesFileName))).Project;
            project = project.AddDocument(
                "Model.cs",
                File.ReadAllText(Path.Join(folder, "Model.cs"))).Project;
            project = project.AddDocument(
                "RootClass.cs",
                File.ReadAllText(Path.Join(folder, "RootClass.cs"))).Project;
            var postProcessor = new TestPostProcessor("RootClass.cs", nonRootTypes: ["Sample.KeepMe"]);

            var resultProject = await postProcessor.RemoveAsync(project);
            var doc= resultProject.Documents
                .Single(d => d.Name == removesInvalidAttributesFileName);
            var root = await doc.GetSyntaxRootAsync();
            var compilation = (CompilationUnitSyntax)root!;

            var namespaceDeclaration = compilation
                .DescendantNodes()
                .OfType<NamespaceDeclarationSyntax>()
                .SingleOrDefault(t => t.Name.ToString() == "Sample");
            var output = namespaceDeclaration!.ToString();

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), output, "The output should match the expected content.");
        }

        [Test]
        public async Task DoesNotRemoveValidAttributes()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(ModelReaderWriterBuildableAttribute).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            const string doesNotRemoveValidAttributesFileName = "DoesNotRemoveValidAttributes.cs";
            project = project.AddDocument(
                doesNotRemoveValidAttributesFileName,
                File.ReadAllText(Path.Join(folder, doesNotRemoveValidAttributesFileName))).Project;
            project = project.AddDocument(
                "Model.cs",
                File.ReadAllText(Path.Join(folder, "Model.cs"))).Project;
            project = project.AddDocument(
                "RootClass.cs",
                File.ReadAllText(Path.Join(folder, "RootClass.cs"))).Project;
            var postProcessor = new TestPostProcessor("RootClass.cs");

            var resultProject = await postProcessor.RemoveAsync(project);
            var doc= resultProject.Documents
                .Single(d => d.Name == doesNotRemoveValidAttributesFileName);
            var root = await doc.GetSyntaxRootAsync();
            var compilation = (CompilationUnitSyntax)root!;

            var namespaceDeclaration = compilation
                .DescendantNodes()
                .OfType<NamespaceDeclarationSyntax>()
                .SingleOrDefault(t => t.Name.ToString() == "Sample");
            var output = namespaceDeclaration!.ToString();

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), output, "The output should match the expected content.");
        }

        [Test]
        public async Task RemovesUnusedUsingFromModelFactoryWhenInternalizing()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            const string rootFileName = "ModelFactoryRoot.cs";
            string[] modelFileNames =
            [
                "KeptModel.cs",
                "OtherNamespaceModel.cs"
            ];
            foreach (var fileName in modelFileNames)
            {
                project = project.AddDocument(
                    fileName,
                    File.ReadAllText(Path.Join(folder, fileName))).Project;
            }
            // The model factory lives in a generated document so the post-processor can rewrite it.
            const string modelFactoryFileName = "SampleModelFactory.cs";
            project = project.AddDocument(
                modelFactoryFileName,
                File.ReadAllText(Path.Join(folder, modelFactoryFileName)),
                folders: ["Generated"]).Project;
            project = project.AddDocument(
                rootFileName,
                File.ReadAllText(Path.Join(folder, rootFileName))).Project;
            var postProcessor = new TestPostProcessor(rootFileName, modelFactoryFullName: "Sample.SampleModelFactory");

            var resultProject = await postProcessor.InternalizeAsync(project);

            // The model in the other namespace is unreferenced and is internalized.
            var otherNamespaceModel = await GetSingleClassAsync(resultProject, "OtherNamespaceModel.cs", "OtherNamespaceModel");
            Assert.IsTrue(otherNamespaceModel.Modifiers.Any(m => m.IsKind(SyntaxKind.InternalKeyword)));

            // The referenced model stays public and keeps its model factory method.
            var keptModel = await GetSingleClassAsync(resultProject, "KeptModel.cs", "KeptModel");
            Assert.IsTrue(keptModel.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword)));

            var modelFactory = await GetSingleClassAsync(resultProject, modelFactoryFileName, "SampleModelFactory");
            var methodNames = modelFactory.Members
                .OfType<MethodDeclarationSyntax>()
                .Select(m => m.Identifier.Text)
                .ToList();
            Assert.IsTrue(methodNames.Contains("KeptModel"), "The model factory method for the referenced model should be preserved.");
            Assert.IsFalse(methodNames.Contains("OtherNamespaceModel"), "The model factory method for the internalized model should be removed.");

            // Removing the model factory method for the internalized model leaves the using for its namespace unused, so it is removed.
            Assert.IsFalse(
                await HasUsingAsync(resultProject, modelFactoryFileName, "Sample.Models"),
                "Unused using for the internalized model's namespace should be removed from the model factory.");

            Assert.AreEqual(
                Helpers.GetExpectedFromFile().TrimEnd(),
                (await GetDocumentTextAsync(resultProject, modelFactoryFileName)).TrimEnd(),
                "The generated model factory output should match the expected content.");
        }

        [Test]
        public async Task KeepsUsedUsingWhenTypeReferencesAreUnresolved()
        {
            MockHelpers.LoadMockGenerator();
            var workspace = new AdhocWorkspace();
            // Intentionally omit the System.ClientModel reference so that the BinaryContent/ClientResult
            // type references in the serialization document cannot be resolved. This mirrors the post-processing
            // compilation in real generation, where not every external assembly is referenced.
            var projectInfo = ProjectInfo.Create(
                    ProjectId.CreateNewId(),
                    VersionStamp.Create(),
                    name: "TestProj",
                    assemblyName: "TestProj",
                    language: LanguageNames.CSharp)
                .WithMetadataReferences(new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(System.BinaryData).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            const string rootFileName = "Root.cs";
            const string serializationFileName = "UnreferencedModel.Serialization.cs";
            foreach (var fileName in new[] { "UnreferencedModel.cs", serializationFileName })
            {
                project = project.AddDocument(fileName, File.ReadAllText(Path.Join(folder, fileName)), folders: ["Generated"]).Project;
            }
            project = project.AddDocument(rootFileName, File.ReadAllText(Path.Join(folder, rootFileName))).Project;
            var postProcessor = new TestPostProcessor(rootFileName);

            var resultProject = await postProcessor.InternalizeAsync(project);

            // The unreferenced model is internalized.
            var model = await GetSingleClassAsync(resultProject, "UnreferencedModel.cs", "UnreferencedModel");
            Assert.IsTrue(model.Modifiers.Any(m => m.IsKind(SyntaxKind.InternalKeyword)));

            // The using is still referenced by the conversion operators, but the type references cannot be
            // resolved in this compilation. The using must be preserved rather than removed by the CS8019 pass.
            Assert.IsTrue(
                await HasUsingAsync(resultProject, serializationFileName, "System.ClientModel"),
                "A used using directive must not be removed when its type references cannot be resolved.");

            Assert.AreEqual(
                Helpers.GetExpectedFromFile().TrimEnd(),
                (await GetDocumentTextAsync(resultProject, serializationFileName)).TrimEnd(),
                "The serialization document should be left untouched when references are unresolved.");
        }

        private static async Task<string> GetDocumentTextAsync(Project project, string fileName)
        {
            var doc = project.Documents.Single(d => d.Name == fileName);
            var root = await doc.GetSyntaxRootAsync();
            return root!.ToFullString();
        }

        private static async Task<bool> HasUsingAsync(Project project, string fileName, string usingName)
        {
            var doc = project.Documents.Single(d => d.Name == fileName);
            var root = await doc.GetSyntaxRootAsync();
            return ((CompilationUnitSyntax)root!)
                .Usings
                .Any(u => u.Name?.ToString() == usingName);
        }

        private static async Task<ClassDeclarationSyntax> GetSingleClassAsync(Project project, string fileName, string className)
        {
            var doc = project.Documents.Single(d => d.Name == fileName);
            var root = await doc.GetSyntaxRootAsync();
            return ((CompilationUnitSyntax)root!)
                .DescendantNodes()
                .OfType<ClassDeclarationSyntax>()
                .Single(t => t.Identifier.Text == className);
        }

        private class TestPostProcessor : PostProcessor
        {
            private readonly string _rootFile;

            public TestPostProcessor(string rootFile, IEnumerable<string>? nonRootTypes = null, string? modelFactoryFullName = null) : base([], modelFactoryFullName: modelFactoryFullName, additionalNonRootTypeNames: nonRootTypes)
            {
                _rootFile = rootFile;
            }

            protected override Task<bool> IsRootDocument(Document document)
            {
                return document.Name == _rootFile ? Task.FromResult(true) : Task.FromResult(false);
            }
        }
    }
}
