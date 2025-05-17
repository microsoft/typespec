// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
            project = project.AddDocument("RemovesInvalidUsings.cs", Helpers.GetExpectedFromFile()).Project;
            var postProcessor = new PostProcessor(typesToKeep: []);

            var resultProject = await postProcessor.RemoveAsync(project);
            var doc= resultProject.GetDocument(project.DocumentIds.Single())!;
            var root = await doc.GetSyntaxRootAsync();
            var compilation = (CompilationUnitSyntax)root!;

            var typeNames = compilation
                .DescendantNodes()
                .OfType<BaseTypeDeclarationSyntax>()
                .Select(t => t.Identifier.Text)
                .ToList();
            CollectionAssert.Contains(typeNames, "KeepMe");

            var namespaces = compilation
                .DescendantNodes()
                .OfType<NamespaceDeclarationSyntax>()
                .Select(n => n.Name.ToString())
                .ToList();
            CollectionAssert.DoesNotContain(namespaces, "Sample.Invalid");

            var usings = compilation.Usings.Select(u => u.Name!.ToString()).ToList();
            // The invalid using should be removed
            CollectionAssert.DoesNotContain(usings, "Sample.Invalid");

            CollectionAssert.Contains(usings, "System");
            CollectionAssert.Contains(namespaces, "Sample");
        }
    }
}
