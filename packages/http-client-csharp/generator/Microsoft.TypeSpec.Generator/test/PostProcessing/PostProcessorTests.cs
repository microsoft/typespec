// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
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
        public async Task RemovesExperimentalAttributeWhenInternalizing()
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
                    MetadataReference.CreateFromFile(typeof(ExperimentalAttribute).Assembly.Location)
                });

            var project = workspace.AddProject(projectInfo);
            var folder = Helpers.GetAssetFileOrDirectoryPath(false);
            const string rootFileName = "ExperimentalInternalizeRoot.cs";
            string[] modelFileNames =
            [
                "ReferencedModel.cs",
                "UnreferencedModel.cs",
                "UnreferencedWithOtherAttribute.cs",
                "UnreferencedWithCombinedAttributes.cs",
                "UnreferencedStillUsingCodeAnalysis.cs"
            ];
            foreach (var fileName in modelFileNames)
            {
                project = project.AddDocument(
                    fileName,
                    File.ReadAllText(Path.Join(folder, fileName))).Project;
            }
            project = project.AddDocument(
                rootFileName,
                File.ReadAllText(Path.Join(folder, rootFileName))).Project;
            var postProcessor = new TestPostProcessor(rootFileName);

            var resultProject = await postProcessor.InternalizeAsync(project);

            var referencedModel = await GetSingleClassAsync(resultProject, "ReferencedModel.cs", "ReferencedModel");
            var unreferencedModel = await GetSingleClassAsync(resultProject, "UnreferencedModel.cs", "UnreferencedModel");
            var unreferencedWithOther = await GetSingleClassAsync(resultProject, "UnreferencedWithOtherAttribute.cs", "UnreferencedWithOtherAttribute");
            var unreferencedWithCombined = await GetSingleClassAsync(resultProject, "UnreferencedWithCombinedAttributes.cs", "UnreferencedWithCombinedAttributes");

            // The referenced model stays public and keeps its [Experimental] attribute.
            Assert.IsTrue(referencedModel.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword)));
            Assert.IsTrue(HasExperimentalAttribute(referencedModel), "Referenced (public) model should keep [Experimental].");

            // The unreferenced model is internalized and loses its [Experimental] attribute.
            Assert.IsTrue(unreferencedModel.Modifiers.Any(m => m.IsKind(SyntaxKind.InternalKeyword)));
            Assert.IsFalse(unreferencedModel.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword)));
            Assert.IsFalse(HasExperimentalAttribute(unreferencedModel), "Internalized model should not keep [Experimental].");

            // The documentation comment on the internalized type is preserved.
            Assert.IsTrue(
                unreferencedModel.GetLeadingTrivia().ToFullString().Contains("not referenced"),
                "Doc comment of the internalized type should be preserved.");

            // An internalized type with another attribute in a separate list keeps the other attribute.
            Assert.IsTrue(unreferencedWithOther.Modifiers.Any(m => m.IsKind(SyntaxKind.InternalKeyword)));
            Assert.IsFalse(HasExperimentalAttribute(unreferencedWithOther), "Internalized model should not keep [Experimental].");
            Assert.IsTrue(HasAttribute(unreferencedWithOther, "Serializable"), "Other attributes should be preserved.");
            Assert.IsTrue(
                unreferencedWithOther.GetLeadingTrivia().ToFullString().Contains("must be preserved"),
                "Doc comment should be preserved when only one of several attribute lists is removed.");

            // An internalized type with the experimental attribute combined in a single list keeps the others.
            Assert.IsTrue(unreferencedWithCombined.Modifiers.Any(m => m.IsKind(SyntaxKind.InternalKeyword)));
            Assert.IsFalse(HasExperimentalAttribute(unreferencedWithCombined), "Internalized model should not keep [Experimental].");
            Assert.IsTrue(HasAttribute(unreferencedWithCombined, "Serializable"), "Other attributes in the same list should be preserved.");

            // The referenced model keeps its [Experimental] attribute and therefore keeps the using directive.
            Assert.IsTrue(
                await HasCodeAnalysisUsingAsync(resultProject, "ReferencedModel.cs"),
                "Referenced model should keep the System.Diagnostics.CodeAnalysis using.");

            // Internalizing strips [Experimental], leaving the System.Diagnostics.CodeAnalysis using unused, so it is removed.
            Assert.IsFalse(
                await HasCodeAnalysisUsingAsync(resultProject, "UnreferencedModel.cs"),
                "Unused System.Diagnostics.CodeAnalysis using should be removed.");
            Assert.IsFalse(
                await HasCodeAnalysisUsingAsync(resultProject, "UnreferencedWithOtherAttribute.cs"),
                "Unused System.Diagnostics.CodeAnalysis using should be removed when another attribute is preserved.");
            Assert.IsFalse(
                await HasCodeAnalysisUsingAsync(resultProject, "UnreferencedWithCombinedAttributes.cs"),
                "Unused System.Diagnostics.CodeAnalysis using should be removed when attributes are combined in one list.");

            // When the namespace is still used by another attribute, the using directive must be preserved.
            var unreferencedStillUsing = await GetSingleClassAsync(resultProject, "UnreferencedStillUsingCodeAnalysis.cs", "UnreferencedStillUsingCodeAnalysis");
            Assert.IsTrue(unreferencedStillUsing.Modifiers.Any(m => m.IsKind(SyntaxKind.InternalKeyword)));
            Assert.IsFalse(HasExperimentalAttribute(unreferencedStillUsing), "Internalized model should not keep [Experimental].");
            Assert.IsTrue(HasAttribute(unreferencedStillUsing, "SuppressMessage"), "Other CodeAnalysis attributes should be preserved.");
            Assert.IsTrue(
                await HasCodeAnalysisUsingAsync(resultProject, "UnreferencedStillUsingCodeAnalysis.cs"),
                "System.Diagnostics.CodeAnalysis using should be preserved when still referenced by another attribute.");
        }

        private static async Task<bool> HasCodeAnalysisUsingAsync(Project project, string fileName)
        {
            var doc = project.Documents.Single(d => d.Name == fileName);
            var root = await doc.GetSyntaxRootAsync();
            return ((CompilationUnitSyntax)root!)
                .Usings
                .Any(u => u.Name?.ToString() == "System.Diagnostics.CodeAnalysis");
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

        private static bool HasAttribute(BaseTypeDeclarationSyntax type, string attributeName)
            => type.AttributeLists
                .SelectMany(list => list.Attributes)
                .Any(attr => attr.Name.ToString() == attributeName);


        private static bool HasExperimentalAttribute(BaseTypeDeclarationSyntax type)
            => type.AttributeLists
                .SelectMany(list => list.Attributes)
                .Any(attr => attr.Name.ToString() is "Experimental" or "ExperimentalAttribute");

        private class TestPostProcessor : PostProcessor
        {
            private readonly string _rootFile;

            public TestPostProcessor(string rootFile, IEnumerable<string>? nonRootTypes = null) : base([], additionalNonRootTypeNames: nonRootTypes)
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
