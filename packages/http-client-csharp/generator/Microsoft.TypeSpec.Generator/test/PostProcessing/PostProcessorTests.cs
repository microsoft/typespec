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
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
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
        public async Task InternalizeUsesProviderPublicApiReferences()
        {
            MockHelpers.LoadMockGenerator();

            var request = new TestTypeProvider("RequestBody", Path.Combine("src", "Generated", "Models", "RequestBody.cs"));
            var dependency = new TestTypeProvider("Dependency", Path.Combine("src", "Generated", "Models", "Dependency.cs"));
            var response = new TestTypeProvider("ResponseBody", Path.Combine("src", "Generated", "Models", "ResponseBody.cs"));
            response.PropertiesToBuild.Add(new PropertyProvider(
                null,
                MethodSignatureModifiers.Public,
                dependency.Type,
                "Dependency",
                new AutoPropertyBody(false),
                response));

            var client = new TestTypeProvider("SampleClient", Path.Combine("src", "Generated", "SampleClient.cs"));
            client.FieldsToBuild.Add(new FieldProvider(FieldModifiers.Private, request.Type, "_request", client));
            client.MethodsToBuild.Add(new MethodProvider(
                new MethodSignature("Get", null, MethodSignatureModifiers.Public, response.Type, null, []),
                MethodBodyStatement.Empty,
                client));

            var providers = new[] { client, request, response, dependency };
            var project = CreateProject(providers);

            var postProcessor = new PostProcessor([]);
            var resultProject = await postProcessor.InternalizeAsync(project, providers);

            AssertTypeAccessibility(resultProject, "SampleClient", SyntaxKind.PublicKeyword);
            AssertTypeAccessibility(resultProject, "ResponseBody", SyntaxKind.PublicKeyword);
            AssertTypeAccessibility(resultProject, "Dependency", SyntaxKind.PublicKeyword);
            AssertTypeAccessibility(resultProject, "RequestBody", SyntaxKind.InternalKeyword);
        }

        private static Project CreateProject(IEnumerable<TypeProvider> providers)
        {
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
            foreach (var provider in providers)
            {
                var codeFile = new TypeProviderWriter(provider).Write();
                project = project.AddDocument(codeFile.Name, codeFile.Content, ["Generated"]).Project;
            }

            return project;
        }

        private static void AssertTypeAccessibility(Project project, string typeName, SyntaxKind expectedAccessibility)
        {
            var type = project.Documents
                .Select(document => document.GetSyntaxRootAsync().Result)
                .Where(root => root != null)
                .SelectMany(root => root!.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
                .Single(t => t.Identifier.Text == typeName);

            Assert.IsTrue(
                type.Modifiers.Any(expectedAccessibility),
                $"Expected {typeName} to have {expectedAccessibility}.");
        }

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

        private class TestTypeProvider : TypeProvider
        {
            private readonly string _name;
            private readonly string _relativeFilePath;

            public TestTypeProvider(string name, string relativeFilePath)
            {
                _name = name;
                _relativeFilePath = relativeFilePath;
            }

            public List<FieldProvider> FieldsToBuild { get; } = [];
            public List<MethodProvider> MethodsToBuild { get; } = [];
            public List<PropertyProvider> PropertiesToBuild { get; } = [];

            protected override string BuildName() => _name;

            protected override string BuildNamespace() => "Sample";

            protected override string BuildRelativeFilePath() => _relativeFilePath;

            protected override TypeSignatureModifiers BuildDeclarationModifiers()
                => TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;

            protected internal override FieldProvider[] BuildFields() => [.. FieldsToBuild];

            protected internal override MethodProvider[] BuildMethods() => [.. MethodsToBuild];

            protected internal override PropertyProvider[] BuildProperties() => [.. PropertiesToBuild];
        }
    }
}
