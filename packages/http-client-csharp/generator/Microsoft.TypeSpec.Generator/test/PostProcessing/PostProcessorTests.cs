// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
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

        private class TestPostProcessor : PostProcessor
        {
            private readonly string _rootFile;

            public TestPostProcessor(string rootFile) : base([])
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
