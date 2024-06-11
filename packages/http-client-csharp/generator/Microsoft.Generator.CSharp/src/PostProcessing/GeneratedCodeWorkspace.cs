// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Formatting;
using Microsoft.CodeAnalysis.Simplification;

namespace Microsoft.Generator.CSharp
{
    internal class GeneratedCodeWorkspace
    {
        private const string GeneratedFolder = "Generated";
        private const string GeneratedCodeProjectName = "GeneratedCode";

        private static readonly Lazy<IReadOnlyList<MetadataReference>> _assemblyMetadataReferences = new(() => new List<MetadataReference>()
            { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) });
        private static readonly Lazy<WorkspaceMetadataReferenceResolver> _metadataReferenceResolver = new(() => new WorkspaceMetadataReferenceResolver());
        private static Task<Project>? _cachedProject;
        private static readonly string[] _generatedFolders = { GeneratedFolder };
        private static readonly string _newLine = "\n";

        private Project _project;
        private Dictionary<string, string> PlainFiles { get; }

        private GeneratedCodeWorkspace(Project generatedCodeProject)
        {
            _project = generatedCodeProject;
            PlainFiles = new();
        }

        /// <summary>
        /// Creating AdHoc workspace and project takes a while, we'd like to preload this work
        /// to the generator startup time
        /// </summary>
        public static void Initialize()
        {
            _cachedProject = Task.Run(CreateGeneratedCodeProject);
        }

        public void AddPlainFiles(string name, string content)
        {
            PlainFiles.Add(name, content);
        }

        public async Task AddGeneratedFile(CodeFile codefile)
        {
            var document = _project.AddDocument(codefile.Name, codefile.Content, _generatedFolders);
            var root = await document.GetSyntaxRootAsync();
            Debug.Assert(root != null);

            root = root.WithAdditionalAnnotations(Simplifier.Annotation);
            document = document.WithSyntaxRoot(root);
            _project = document.Project;
        }

        public async IAsyncEnumerable<(string Name, string Text)> GetGeneratedFilesAsync()
        {
            List<Task<Document>> documents = new List<Task<Document>>();
            foreach (Document document in _project.Documents)
            {
                if (!IsGeneratedDocument(document))
                {
                    continue;
                }

                documents.Add(ProcessDocument(document));
            }
            var docs = await Task.WhenAll(documents);

            foreach (var doc in docs)
            {
                var processed = doc;

                var text = await processed.GetSyntaxTreeAsync();
                yield return (processed.Name, text!.ToString());
            }

            foreach (var (file, content) in PlainFiles)
            {
                yield return (file, content);
            }
        }

        private async Task<Document> ProcessDocument(Document document)
        {
            document = await Simplifier.ReduceAsync(document);
            return document;
        }

        public static bool IsGeneratedDocument(Document document) => document.Folders.Contains(GeneratedFolder);

        /// <summary>
        /// Create a new AdHoc workspace using the Roslyn SDK and add a project with all the necessary compilation options.
        /// </summary>
        /// <returns>The created project in the solution.</returns>
        private static Project CreateGeneratedCodeProject()
        {
            var workspace = new AdhocWorkspace();
            var newOptionSet = workspace.Options.WithChangedOption(FormattingOptions.NewLine, LanguageNames.CSharp, _newLine);
            workspace.TryApplyChanges(workspace.CurrentSolution.WithOptions(newOptionSet));
            Project generatedCodeProject = workspace.AddProject(GeneratedCodeProjectName, LanguageNames.CSharp);

            generatedCodeProject = generatedCodeProject
                .AddMetadataReferences(_assemblyMetadataReferences.Value)
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable));
            return generatedCodeProject;
        }

        internal static async Task<GeneratedCodeWorkspace> Create()
        {
            var projectTask = Interlocked.Exchange(ref _cachedProject, null);
            var generatedCodeProject = projectTask != null ? await projectTask : CreateGeneratedCodeProject();

            var outputDirectory = CodeModelPlugin.Instance.Configuration.OutputDirectory;
            var projectDirectory = CodeModelPlugin.Instance.Configuration.ProjectDirectory;

            if (Path.IsPathRooted(projectDirectory) && Path.IsPathRooted(outputDirectory))
            {
                projectDirectory = Path.GetFullPath(projectDirectory);
                outputDirectory = Path.GetFullPath(outputDirectory);

                Directory.CreateDirectory(projectDirectory);
                Directory.CreateDirectory(outputDirectory);

                generatedCodeProject = AddDirectory(generatedCodeProject, projectDirectory, skipPredicate: sourceFile => sourceFile.StartsWith(outputDirectory));
            }

            generatedCodeProject = generatedCodeProject.WithParseOptions(new CSharpParseOptions(preprocessorSymbols: new[] { "EXPERIMENTAL" }));
            return new GeneratedCodeWorkspace(generatedCodeProject);
        }

        public static GeneratedCodeWorkspace CreateExistingCodeProject(string outputDirectory)
        {
            var workspace = new AdhocWorkspace();
            var newOptionSet = workspace.Options.WithChangedOption(FormattingOptions.NewLine, LanguageNames.CSharp, _newLine);
            workspace.TryApplyChanges(workspace.CurrentSolution.WithOptions(newOptionSet));
            Project project = workspace.AddProject("ExistingCode", LanguageNames.CSharp);

            if (Path.IsPathRooted(outputDirectory))
            {
                outputDirectory = Path.GetFullPath(outputDirectory);
                project = AddDirectory(project, outputDirectory, null);
            }

            project = project
                .AddMetadataReferences(_assemblyMetadataReferences.Value)
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable));

            return new GeneratedCodeWorkspace(project);
        }

        public static async Task<Compilation?> CreatePreviousContractFromDll(string xmlDocumentationpath, string dllPath)
        {
            var workspace = new AdhocWorkspace();
            Project project = workspace.AddProject("PreviousContract", LanguageNames.CSharp);
            project = project
                .AddMetadataReferences(_assemblyMetadataReferences.Value)
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable));
            project = project.AddMetadataReference(MetadataReference.CreateFromFile(dllPath, documentation: XmlDocumentationProvider.CreateFromFile(xmlDocumentationpath)));
            return await project.GetCompilationAsync();
        }

        /// <summary>
        /// Add the files in the directory to a project per a given predicate with the folders specified
        /// </summary>
        /// <param name="project"></param>
        /// <param name="directory"></param>
        /// <param name="skipPredicate"></param>
        /// <param name="folders"></param>
        /// <returns>The <see cref="Project"/> instance with the added directory and files.</returns>
        internal static Project AddDirectory(Project project, string directory, Func<string, bool>? skipPredicate = null, IEnumerable<string>? folders = null)
        {
            foreach (string sourceFile in Directory.GetFiles(directory, "*.cs", SearchOption.AllDirectories))
            {
                if (skipPredicate != null && skipPredicate(sourceFile))
                    continue;

                project = project.AddDocument(sourceFile, File.ReadAllText(sourceFile), folders ?? Array.Empty<string>(), sourceFile).Project;
            }

            return project;
        }
    }
}
