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
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.FindSymbols;
using Microsoft.CodeAnalysis.Formatting;
using Microsoft.CodeAnalysis.Simplification;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp
{
    internal class GeneratedCodeWorkspace
    {
        private const string GeneratedFolder = "Generated";
        private const string InternalFolder = "Internal";
        private const string GeneratedCodeProjectName = "GeneratedCode";

        private static readonly Lazy<IReadOnlyList<MetadataReference>> _assemblyMetadataReferences = new(() => new List<MetadataReference>()
            { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) });
        private static readonly Lazy<WorkspaceMetadataReferenceResolver> _metadataReferenceResolver = new(() => new WorkspaceMetadataReferenceResolver());
        private static Task<Project>? _cachedProject;
        private static readonly string[] _generatedFolders = { GeneratedFolder };
        private static readonly string _newLine = "\n";

        private Project _project;
        private Compilation? _compilation;

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
            var used = new Dictionary<Document, bool>();
            foreach (Document document in _project.Documents)
            {
                if (!IsGeneratedDocument(document))
                {
                    continue;
                }

                if (IsInternalGeneratedDocument(document) && !(await IsUsedAsync(_project.Solution, document, used)))
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

        private static bool IsGeneratedDocument(Document document) => document.Folders.Contains(GeneratedFolder);

        private static bool IsInternalGeneratedDocument(Document document) => IsGeneratedDocument(document) && document.Name.Contains(InternalFolder);

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
                .AddMetadataReferences(_assemblyMetadataReferences.Value.Concat(CodeModelPlugin.Instance.AdditionalMetadataReferences))
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

        private async Task<bool> IsUsedAsync(Solution solution, Document document, IDictionary<Document, bool> used)
        {
            if (used.TryGetValue(document, out var value))
            {
                return value;
            }
            var model = await document.GetSemanticModelAsync();
            var declarations = (await document.GetSyntaxRootAsync())!.DescendantNodes().Where(n => n is TypeDeclarationSyntax or EnumDeclarationSyntax);
            foreach (var declaration in declarations)
            {
                var type = (INamedTypeSymbol)model!.GetDeclaredSymbol(declaration)!;
                if (await IsUsedAsync(solution, type, used))
                {
                    used[document] = true;
                    return true;
                }
            }

            used[document] = false;
            return false;
        }

        private async Task<bool> IsUsedAsync(Solution solution, ISymbol type, IDictionary<Document, bool> used)
        {
            if (type.IsStatic)
            {
                var extMethods = ((INamedTypeSymbol)type).GetMembers().Where(s => s.Kind == SymbolKind.Method).Where(m => ((IMethodSymbol)m).IsExtensionMethod);
                var enumerable = extMethods as ISymbol[] ?? extMethods.ToArray();
                if (enumerable.Length != 0)
                {
                    return true;
                }
            }
            return await IsUsedCore(solution, type, used);
        }
        private async Task<bool> IsUsedCore(Solution solution, ISymbol type, IDictionary<Document, bool> used)
        {
            var typeRefs = await SymbolFinder.FindReferencesAsync(type, solution);
            foreach (var typeRef in typeRefs)
            {
                // Skip self-references
                if (SymbolEqualityComparer.Default.Equals(typeRef.Definition, type))
                {
                    continue;
                }

                foreach (var loc in typeRef.Locations)
                {
                    // recursively search for non-internal generated code
                    if (IsInternalGeneratedDocument(loc.Document))
                    {
                        return await IsUsedAsync(solution, loc.Document, used);
                    }

                    var node = (await loc.Location.SourceTree?.GetRootAsync()!).FindNode(loc.Location.SourceSpan);
                    while (node != null && !node.IsKind(SyntaxKind.ClassDeclaration) && !node.IsKind(SyntaxKind.InterfaceDeclaration) && !node.IsKind(SyntaxKind.StructDeclaration))
                    {
                        node = node.Parent;
                    }
                    if (node == null)
                    {
                        continue;
                    }
                    Compilation compilation = await GetProjectCompilation();
                    ISymbol nodeSymbol = compilation.GetSemanticModel(loc.Location.SourceTree!).GetDeclaredSymbol(node)!;
                    if (!SymbolEqualityComparer.Default.Equals(nodeSymbol, type))
                    {
                        return true;
                    }
                }
            }
            return false;
        }

        private async Task<Compilation> GetProjectCompilation()
        {
            _compilation ??= await _project.GetCompilationAsync();
            return _compilation!;
        }
    }
}
