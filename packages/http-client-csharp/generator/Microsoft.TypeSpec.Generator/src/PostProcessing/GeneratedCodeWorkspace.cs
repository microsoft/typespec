// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using MSBuildProjectCollection = Microsoft.Build.Evaluation.ProjectCollection;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Formatting;
using Microsoft.CodeAnalysis.Simplification;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Utilities;
using NuGet.Configuration;

namespace Microsoft.TypeSpec.Generator
{
    internal class GeneratedCodeWorkspace
    {
        private const string SharedFolder = "Shared";
        private const string GeneratedFolder = "Generated";
        private const string GeneratedCodeProjectName = "GeneratedCode";
        private const string GeneratedTestFolder = "GeneratedTests";
        private const string NewLine = "\n";
        private const string ApiCompatPropertyName = "ApiCompatVersion";
        private const string TargetFrameworkPropertyName = "TargetFramework";
        private const string TargetFrameworksPropertyName = "TargetFrameworks";

        private static readonly Lazy<IReadOnlyList<MetadataReference>> _assemblyMetadataReferences = new(() => new List<MetadataReference>()
            { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) });
        private static readonly Lazy<WorkspaceMetadataReferenceResolver> _metadataReferenceResolver = new(() => new WorkspaceMetadataReferenceResolver());
        private static Task<Project>? _cachedProject;

        private static readonly string[] _generatedFolders = [GeneratedFolder];
        private static readonly string[] _sharedFolders = [SharedFolder];

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

        internal async Task<CSharpCompilation> GetCompilationAsync()
        {
            var compilation = await _project.GetCompilationAsync();
            Debug.Assert(compilation is CSharpCompilation);

            return (CSharpCompilation)compilation;
        }

        public void AddPlainFiles(string name, string content)
        {
            PlainFiles.Add(name, content);
        }

        public async Task AddGeneratedFile(CodeFile codefile)
        {
            var document = _project.AddDocument(codefile.Name, codefile.Content, _generatedFolders);
            await UpdateProject(document);
        }

        public async Task AddInMemoryFile(TypeProvider type)
        {
            var document = _project.AddDocument(type.Name, GetTree(type).GetRoot(), _generatedFolders);
            await UpdateProject(document);
        }

        private async Task UpdateProject(Document document)
        {
            var root = await document.GetSyntaxRootAsync();
            Debug.Assert(root != null);

            _project = document.Project;
        }

        internal static SyntaxTree GetTree(TypeProvider provider)
        {
            var writer = new TypeProviderWriter(provider);
            var file = writer.Write();
            return CSharpSyntaxTree.ParseText(file.Content, path: Path.Join(provider.RelativeFilePath, provider.Name + ".cs"));
        }

        public async IAsyncEnumerable<(string Name, string Text)> GetGeneratedFilesAsync()
        {
            List<Task<Document>> documents = new List<Task<Document>>();
            var memberRemover = new MemberRemoverRewriter();
            foreach (Document document in _project.Documents)
            {
                if (!IsGeneratedDocument(document))
                {
                    continue;
                }

                documents.Add(ProcessDocument(document, memberRemover));
            }
            var docs = await Task.WhenAll(documents);

            LoggingHelpers.LogElapsedTime("Roslyn post processing complete");

            foreach (var doc in docs)
            {
                var text = await doc.GetTextAsync();
                yield return (doc.Name, text.ToString());
            }

            foreach (var (file, content) in PlainFiles)
            {
                yield return (file, content);
            }
        }

        private async Task<Document> ProcessDocument(Document document, MemberRemoverRewriter memberRemover)
        {
            var root = await document.GetSyntaxRootAsync();
            var semanticModel = await document.GetSemanticModelAsync();

            if (semanticModel == null || root == null)
            {
                return document;
            }

            root = memberRemover.Visit(root);

            foreach (var rewriter in CodeModelGenerator.Instance.Rewriters)
            {
                rewriter.SemanticModel = semanticModel;
                root = rewriter.Visit(root);
            }
            document = document.WithSyntaxRoot(root);

            var containsSimplifierAnnotations = root.GetAnnotatedNodesAndTokens(Simplifier.Annotation).Any();
            if (containsSimplifierAnnotations)
            {
                document = await Simplifier.ReduceAsync(document);
                root = await document.GetSyntaxRootAsync();
            }

            if (root != null)
            {
                document = document.WithSyntaxRoot(SimplifyGlobalAliases(root));
            }

            // Reformat if any custom rewriters have been applied
            if (CodeModelGenerator.Instance.Rewriters.Count > 0)
            {
                document = await Formatter.FormatAsync(document);
            }
            return document;
        }

        private static SyntaxNode SimplifyGlobalAliases(SyntaxNode root)
        {
            var usingNamespaces = root
                .DescendantNodes()
                .OfType<UsingDirectiveSyntax>()
                .Where(usingDirective => usingDirective.Alias == null && usingDirective.StaticKeyword.IsKind(SyntaxKind.None))
                .Select(usingDirective => usingDirective.Name?.ToString())
                .Concat(root.DescendantNodes().OfType<BaseNamespaceDeclarationSyntax>().Select(ns => ns.Name.ToString()))
                .Where(ns => ns is not null)
                .Select(ns => ns!)
                .Distinct(StringComparer.Ordinal)
                .OrderByDescending(static ns => ns.Length)
                .ToArray();

            if (usingNamespaces.Length == 0)
            {
                return root;
            }

            bool wasChanged;
            do
            {
                wasChanged = false;
                var replacements = root
                    .DescendantNodes()
                    .OfType<AliasQualifiedNameSyntax>()
                    .Where(name => name.Alias.Identifier.ValueText == "global")
                    .Select(GetOutermostQualifiedName)
                    .Distinct()
                    .Select(name => (Original: name, Replacement: SimplifyName(name, usingNamespaces)))
                    .Where(replacement => replacement.Replacement != null)
                    .ToDictionary(replacement => replacement.Original, replacement => replacement.Replacement!);

                if (replacements.Count > 0)
                {
                    root = root.ReplaceNodes(replacements.Keys, (original, rewritten) => replacements[original].WithTriviaFrom(rewritten));
                    wasChanged = true;
                }

                var memberAccessReplacements = root
                    .DescendantNodes()
                    .OfType<MemberAccessExpressionSyntax>()
                    .Select(memberAccess => (Original: memberAccess, Replacement: SimplifyMemberAccess(memberAccess, usingNamespaces)))
                    .Where(replacement => replacement.Replacement != null)
                    .ToDictionary(replacement => replacement.Original, replacement => replacement.Replacement!);

                if (memberAccessReplacements.Count > 0)
                {
                    root = root.ReplaceNodes(memberAccessReplacements.Keys, (original, rewritten) => memberAccessReplacements[original].WithTriviaFrom(rewritten));
                    wasChanged = true;
                }
            } while (wasChanged);

            return root;
        }

        private static NameSyntax GetOutermostQualifiedName(AliasQualifiedNameSyntax globalAlias)
        {
            NameSyntax node = globalAlias;
            while (node.Parent is QualifiedNameSyntax parent && parent.Left == node)
            {
                node = parent;
            }

            return node;
        }

        private static NameSyntax? SimplifyName(NameSyntax name, IReadOnlyList<string> usingNamespaces)
        {
            var simplifiedName = SimplifyGlobalAlias(name.ToString(), usingNamespaces);
            return simplifiedName == null ? null : SyntaxFactory.ParseName(simplifiedName).WithTriviaFrom(name);
        }

        private static MemberAccessExpressionSyntax? SimplifyMemberAccess(MemberAccessExpressionSyntax memberAccess, IReadOnlyList<string> usingNamespaces)
        {
            var simplifiedExpression = SimplifyGlobalAlias(memberAccess.Expression.ToString(), usingNamespaces);
            return simplifiedExpression == null
                ? null
                : memberAccess.WithExpression(SyntaxFactory.ParseExpression(simplifiedExpression).WithTriviaFrom(memberAccess.Expression));
        }

        private static string? SimplifyGlobalAlias(string fullyQualifiedName, IReadOnlyList<string> usingNamespaces)
        {
            const string globalAlias = "global::";
            if (!fullyQualifiedName.StartsWith(globalAlias, StringComparison.Ordinal))
            {
                return null;
            }

            var nameWithoutGlobalAlias = fullyQualifiedName[globalAlias.Length..];
            foreach (var usingNamespace in usingNamespaces)
            {
                if (nameWithoutGlobalAlias.StartsWith(usingNamespace + ".", StringComparison.Ordinal))
                {
                    var simplifiedName = nameWithoutGlobalAlias[(usingNamespace.Length + 1)..];
                    return IsSimpleTypeName(simplifiedName) ? simplifiedName : null;
                }
            }

            return null;
        }

        private static bool IsSimpleTypeName(string name)
        {
            var genericStart = name.IndexOf('<');
            var typeNameLength = genericStart < 0 ? name.Length : genericStart;
            return name.AsSpan(0, typeNameLength).IndexOf('.') < 0;
        }

        public static bool IsGeneratedDocument(Document document) => document.Folders.Contains(GeneratedFolder);
        public static bool IsCustomDocument(Document document) => !IsGeneratedDocument(document);
        public static bool IsGeneratedTestDocument(Document document) => document.Folders.Contains(GeneratedTestFolder);

        /// <summary>
        /// Create a new AdHoc workspace using the Roslyn SDK and add a project with all the necessary compilation options.
        /// </summary>
        /// <returns>The created project in the solution.</returns>
        private static Project CreateGeneratedCodeProject()
        {
            var workspace = new AdhocWorkspace();
            var newOptionSet = workspace.Options.WithChangedOption(FormattingOptions.NewLine, LanguageNames.CSharp, NewLine);
            workspace.TryApplyChanges(workspace.CurrentSolution.WithOptions(newOptionSet));
            Project generatedCodeProject = workspace.AddProject(GeneratedCodeProjectName, LanguageNames.CSharp);

            generatedCodeProject = generatedCodeProject
                .AddMetadataReferences(_assemblyMetadataReferences.Value.Concat(CodeModelGenerator.Instance.AdditionalMetadataReferences))
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable));
            return generatedCodeProject;
        }

        internal static async Task<GeneratedCodeWorkspace> Create(bool isCustomCodeProject)
        {
            // prepare the generated code project
            var projectTask = Interlocked.Exchange(ref _cachedProject, null);
            var project = projectTask != null ? await projectTask : CreateGeneratedCodeProject();

            var outputDirectory = CodeModelGenerator.Instance.Configuration.OutputDirectory;
            var projectDirectory = CodeModelGenerator.Instance.Configuration.ProjectDirectory;
            var generatedDirectory = CodeModelGenerator.Instance.Configuration.ProjectGeneratedDirectory;

            // add all documents except the documents from the generated directory
            if (Path.IsPathRooted(projectDirectory) && Path.IsPathRooted(outputDirectory))
            {
                projectDirectory = Path.GetFullPath(projectDirectory);
                outputDirectory = Path.GetFullPath(outputDirectory);

                Directory.CreateDirectory(projectDirectory);
                Directory.CreateDirectory(outputDirectory);

                project = AddDirectory(project, projectDirectory, skipPredicate: sourceFile => sourceFile.StartsWith(generatedDirectory));
            }

            foreach (var sharedSourceFolder in CodeModelGenerator.Instance.SharedSourceDirectories)
            {
                project = AddDirectory(project, sharedSourceFolder, folders: _sharedFolders);
            }

            project = project.WithParseOptions(new CSharpParseOptions(
                preprocessorSymbols: ["EXPERIMENTAL"],
                documentationMode: isCustomCodeProject ? DocumentationMode.None : DocumentationMode.Parse));

            return new GeneratedCodeWorkspace(project);
        }

        private static async Task<Compilation?> CreateLastContractFromDll(string xmlDocumentationpath, string dllPath)
        {
            var workspace = new AdhocWorkspace();
            Project project = workspace.AddProject("LastContract", LanguageNames.CSharp);
            XmlDocumentationProvider? documentationProvider = File.Exists(xmlDocumentationpath)
               ? XmlDocumentationProvider.CreateFromFile(xmlDocumentationpath)
               : null;
            List<MetadataReference> metadataReferences =
            [
                .. _assemblyMetadataReferences.Value.Concat(CodeModelGenerator.Instance.AdditionalMetadataReferences),
                MetadataReference.CreateFromFile(dllPath, documentation: documentationProvider)
            ];
            project = project
                .AddMetadataReferences(metadataReferences)
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable));
            return await project.GetCompilationAsync();
        }

        /// <summary>
        /// Add the files in the directory to a project per a given predicate with the folders specified.
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

        /// <summary>
        /// This method invokes the postProcessor to do some post processing work
        /// Depending on the configuration, it will either remove + internalize, just internalize or do nothing
        /// </summary>
        public async Task PostProcessAsync()
        {
            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            var nonRootTypes = CodeModelGenerator.Instance.NonRootTypes;
            var postProcessor = new PostProcessor(
                [.. CodeModelGenerator.Instance.TypeFactory.UnionVariantTypesToKeep, .. CodeModelGenerator.Instance.AdditionalRootTypes],
                modelFactoryFullName: modelFactory.Type.FullyQualifiedName,
                additionalNonRootTypeNames: nonRootTypes);

            switch (Configuration.UnreferencedTypesHandling)
            {
                case Configuration.UnreferencedTypesHandlingOption.KeepAll:
                    break;
                case Configuration.UnreferencedTypesHandlingOption.Internalize:
                    _project = await postProcessor.InternalizeAsync(_project);
                    break;
                case Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize:
                    _project = await postProcessor.InternalizeAsync(_project);
                    _project = await postProcessor.RemoveAsync(_project);
                    break;
            }
        }

        /// <summary>
        /// Resolves PackageReference items from the project's .csproj file and adds their assemblies
        /// as metadata references so that custom code referencing external NuGet types compiles correctly.
        /// </summary>
        internal static async Task AddPackageReferencesFromProject()
        {
            var packageName = CodeModelGenerator.Instance.Configuration.PackageName;
            string projectFilePath = Path.GetFullPath(
                Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, $"{packageName}.csproj"));

            if (!File.Exists(projectFilePath))
            {
                return;
            }

            var projectRoot = ProjectRootElement.Open(projectFilePath, new MSBuildProjectCollection());

            var nugetSettings = Settings.LoadDefaultSettings(projectFilePath);
            var globalPackagesFolder = SettingsUtility.GetGlobalPackagesFolder(nugetSettings);

            // Build a set of assembly names already registered so we can skip them
            var existingRefs = new HashSet<string>(
                CodeModelGenerator.Instance.AdditionalMetadataReferences
                    .Where(r => r.Display is not null)
                    .Select(r => Path.GetFileNameWithoutExtension(r.Display!))
                    .Where(n => !string.IsNullOrEmpty(n)),
                StringComparer.OrdinalIgnoreCase);

            foreach (var item in projectRoot.Items.Where(i => i.ItemType == "PackageReference"))
            {
                var refPackageName = item.Include;

                if (string.IsNullOrEmpty(refPackageName))
                {
                    continue;
                }

                // Skip packages already added as metadata references (e.g., by a plugin)
                if (existingRefs.Contains(refPackageName))
                {
                    continue;
                }

                // Search the NuGet global packages folder for any cached version of this package.
                string? resolvedAssemblyPath = NugetPackageResolver.FindPackageAssembly(globalPackagesFolder, refPackageName);

                // If not found in cache, download the latest version from NuGet feeds
                if (resolvedAssemblyPath == null)
                {
                    try
                    {
                        var latestVersion = await NugetPackageResolver.ResolveLatestPackageVersion(refPackageName, nugetSettings);
                        if (latestVersion != null)
                        {
                            var downloader = new NugetPackageDownloader(refPackageName, latestVersion, null, nugetSettings);
                            var downloadedPath = await downloader.DownloadAndInstallPackage();
                            var downloadedAssembly = Path.Combine(downloadedPath, $"{refPackageName}.dll");
                            if (File.Exists(downloadedAssembly))
                            {
                                resolvedAssemblyPath = downloadedAssembly;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        CodeModelGenerator.Instance.Emitter.Debug(
                            $"Could not download package {refPackageName}: {ex.Message}");
                    }
                }

                if (resolvedAssemblyPath != null)
                {
                    CodeModelGenerator.Instance.AddMetadataReference(
                        MetadataReference.CreateFromFile(resolvedAssemblyPath));
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Added metadata reference: {refPackageName} from {resolvedAssemblyPath}");
                }
            }
        }

        internal static async Task<Compilation?> LoadBaselineContract()
        {
            var packageName = CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace;
            string projectFilePath = Path.GetFullPath(Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, $"{packageName}.csproj"));

            if (!File.Exists(projectFilePath))
                return null;

            var projectRoot = ProjectRootElement.Open(projectFilePath);
            var baselineVersion = projectRoot.Properties.SingleOrDefault(p => p.Name == ApiCompatPropertyName)?.Value;
            if (baselineVersion == null)
                return null;

            var targetFrameworksValue = projectRoot.Properties
                .FirstOrDefault(p => p.Name == TargetFrameworkPropertyName || p.Name == TargetFrameworksPropertyName)?.Value;
            HashSet<string>? parsedTargetFrameworks = ParseNetTargetFrameworks(targetFrameworksValue);

            var nugetSettings = Settings.LoadDefaultSettings(projectFilePath);
            var nugetGlobalPackageFolder = SettingsUtility.GetGlobalPackagesFolder(nugetSettings);

            // Try to find or download the assembly
            try
            {
                string nugetFolderPathToAssembly = string.Empty;
                string assemblyFileFullPath = string.Empty;
                bool foundInstalledAssembly = false;

                foreach (var preferredTargetFramework in NugetPackageDownloader.PreferredDotNetFrameworkVersions)
                {
                    if (parsedTargetFrameworks != null && !parsedTargetFrameworks.Contains(preferredTargetFramework))
                        continue;

                    nugetFolderPathToAssembly = Path.Combine(
                        nugetGlobalPackageFolder,
                        packageName.ToLowerInvariant(),
                        baselineVersion,
                        "lib",
                        preferredTargetFramework);
                    assemblyFileFullPath = Path.Combine(nugetFolderPathToAssembly, $"{packageName}.dll");

                    if (File.Exists(assemblyFileFullPath))
                    {
                        foundInstalledAssembly = true;
                        break;
                    }
                }

                // If assembly doesn't exist locally, download it & install it
                if (!foundInstalledAssembly)
                {
                    NugetPackageDownloader downloader = new(packageName, baselineVersion, parsedTargetFrameworks, nugetSettings);
                    nugetFolderPathToAssembly = await downloader.DownloadAndInstallPackage();
                    assemblyFileFullPath = Path.Combine(nugetFolderPathToAssembly, $"{packageName}.dll");
                }

                string xmlDocPath = Path.Combine(nugetFolderPathToAssembly, $"{packageName}.xml");
                return await CreateLastContractFromDll(xmlDocPath, assemblyFileFullPath);
            }
            catch (Exception ex)
            {
                CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    DiagnosticCodes.BaselineContractMissing,
                    $"Cannot find Baseline contract assembly ({packageName}@{baselineVersion}) from Nuget Global Package Folder. " +
                    $"Please make sure the baseline nuget package has been installed properly. Error: {ex.Message}");
                return null;
            }
        }

        private static HashSet<string>? ParseNetTargetFrameworks(string? targetFrameworksValue)
        {
            if (string.IsNullOrEmpty(targetFrameworksValue))
            {
                return null;
            }

            var parsedFrameworks = targetFrameworksValue.Split(';')
                .Where(framework => framework.StartsWith("net"))
                .ToHashSet();

            return parsedFrameworks.Count > 0 ? parsedFrameworks : null;
        }
    }
}
