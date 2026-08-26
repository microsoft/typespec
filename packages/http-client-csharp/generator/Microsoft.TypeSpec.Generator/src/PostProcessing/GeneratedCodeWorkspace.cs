// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Formatting;
using Microsoft.CodeAnalysis.Simplification;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Utilities;
using NuGet.Configuration;
using NuGet.Frameworks;
using NuGet.Versioning;
using MSBuildProjectCollection = Microsoft.Build.Evaluation.ProjectCollection;

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

            root = root.WithAdditionalAnnotations(Simplifier.Annotation);
            document = document.WithSyntaxRoot(root);
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

            LoggingHelpers.LogElapsedTime("Roslyn document processing complete");

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

            if (!CodeModelGenerator.Instance.Configuration.DisableRoslynReduce)
            {
                document = await Simplifier.ReduceAsync(document);
            }

            // Reformat if any custom rewriters have been applied
            if (CodeModelGenerator.Instance.Rewriters.Count > 0)
            {
                document = await Formatter.FormatAsync(document);
            }
            return document;
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
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable)
                    .WithMetadataImportOptions(MetadataImportOptions.All));
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
                {
                    continue;
                }

                project = project.AddDocument(sourceFile, File.ReadAllText(sourceFile), folders ?? Array.Empty<string>(), sourceFile).Project;
            }

            return project;
        }

        internal static Dictionary<string, Dictionary<string, string>> ReadProjectAssetsMayBe()
        {
            Dictionary<string, Dictionary<string, string>> hshFrameworks = [];
            // Read in the resolved direct dependencies
            DirectoryInfo? directory = (new DirectoryInfo(CodeModelGenerator.Instance.Configuration.OutputDirectory)).Parent?.Parent?.Parent;
            if (directory == null)
            {
                return hshFrameworks;
            }
            string assetsJson = Path.Combine(directory.FullName, "artifacts", "obj", CodeModelGenerator.Instance.Configuration.PackageName, "project.assets.json");
            if (!File.Exists(assetsJson))
            {
                // Try to get file from the project directory.
                assetsJson = Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, "obj", "project.assets.json");
            }
            if (!File.Exists(assetsJson))
            {
                return hshFrameworks;
            }
            Utf8JsonReader reader = new Utf8JsonReader(File.ReadAllBytes(assetsJson));
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            foreach (JsonProperty prop in document.RootElement.EnumerateObject())
            {
                if (prop.Value.ValueKind == JsonValueKind.Object && prop.NameEquals("projectFileDependencyGroups"))
                {
                    foreach (JsonProperty targetFramework in prop.Value.EnumerateObject())
                    {
                        NuGetFramework currentFramework = new(targetFramework.Name);
                        if (!hshFrameworks.ContainsKey(currentFramework.Framework))
                        {
                            hshFrameworks[currentFramework.Framework] = [];
                        }
                        if (targetFramework.Value.ValueKind == JsonValueKind.Array)
                        {
                            // Parse dependencies. They are structured as SomePackage/package.version
                            foreach (JsonElement packageAndVersion in targetFramework.Value.EnumerateArray())
                            {
                                if (packageAndVersion.ValueKind == JsonValueKind.String)
                                {
                                    string[] packageVersionRelation = (packageAndVersion.GetString() ?? "").Split();
                                    // We only support moreor greater relation.
                                    // Example: "Azure.Core >= 1.62.0"
                                    if (packageVersionRelation.Length == 3 && string.Equals(packageVersionRelation[1], ">="))
                                    {
                                        hshFrameworks[currentFramework.Framework][packageVersionRelation[0].ToLower()] = packageVersionRelation[2];
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return hshFrameworks;
        }

        internal static string GetLatestTargetFramework(IEnumerable<string> shortNames)
        {
            //NuGetFramework? maxFramework = shortNames.Select(x => new NuGetFramework(x)).Max();
            // Assume framework order as follows:
            // netstandardX.X, net462, netX.X
            double maxFramework=0.0;
            string maxFrameworkName = string.Empty;
            foreach (string name in shortNames)
            {
                double current=0.0;
                Match numeral = Regex.Match(name, "\\d+[.]*\\d*$");
                if (numeral.Success)
                {
                    current = double.Parse(numeral.Value);
                }
                if (string.Equals(name, "net462", StringComparison.InvariantCultureIgnoreCase))
                {
                    current += 1000.0;
                }
                else if (!name.StartsWith("netstandard", StringComparison.InvariantCultureIgnoreCase))
                {
                    current += 2000.0;
                }
                if (current >= maxFramework)
                {
                    maxFramework = current;
                    maxFrameworkName = name;
                }
            }
            return maxFrameworkName;
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
            // Use the dotnet restore mechanism to get all the dependent packages.
            Process restore = new();
            ProcessStartInfo info = new()
            {
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden,
                FileName = "dotnet",
                ArgumentList = {"restore", projectFilePath},
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };
            restore.StartInfo = info;
            if (restore.Start())
            {
                Task<string> outputTask = restore.StandardOutput.ReadToEndAsync();
                Task<string> errorTask = restore.StandardError.ReadToEndAsync();
                await restore.WaitForExitAsync();
                string output = await outputTask;
                string error = await errorTask;
                if (restore.ExitCode != 0)
                {
                    CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                        code: "unable-to-restore-target-package",
                        message: $"The dotnet restore {projectFilePath} command exited with {restore.ExitCode}.\n" +
                        $"Standard output: {output}\n" +
                        $"Error output: {error}",
                        severity: EmitterRpc.EmitterDiagnosticSeverity.Error
                );
                }
            }
            else
            {
                CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    code: "unable-to-run-dotnet-restore",
                    message: $"Unable to run dotnet restore on the project {projectFilePath}",
                    severity: EmitterRpc.EmitterDiagnosticSeverity.Error
                );
            }
            var projectRoot = ProjectRootElement.Open(projectFilePath, new MSBuildProjectCollection());
            var nugetSettings = Settings.LoadDefaultSettings(projectFilePath);
            var globalPackagesFolder = SettingsUtility.GetGlobalPackagesFolder(nugetSettings);

            // Read in the resolved direct dependencies for all frameworks
            Dictionary<string, Dictionary<string, string>> hshFrameworks = ReadProjectAssetsMayBe();
            // Get the latestr framework.
            Dictionary<string, string> hshNameVersion = [];
            if (hshFrameworks.Count > 0)
            {
                hshNameVersion = hshFrameworks[GetLatestTargetFramework(hshFrameworks.Keys.AsEnumerable())];
            }
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
                string? version = default;
                hshNameVersion.TryGetValue(refPackageName.ToLower(), out version);
                string? resolvedAssemblyPath = version is null
                     ? NugetPackageResolver.FindPackageAssembly(globalPackagesFolder, refPackageName)
                     : NugetPackageResolver.FindPackageAssemblyInVersion(globalPackagesFolder, refPackageName, version);
                if (resolvedAssemblyPath == null)
                {
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"The package {refPackageName}{(version != null ? "v. "+ version : "")} was not restored.");
                }
                else if (version is null)
                {
                    string packageDir = Path.Combine(globalPackagesFolder, refPackageName.ToLowerInvariant());
                    string[] allDirs = Directory.GetDirectories(packageDir);
                    NuGetVersion? maxVersion = allDirs.Select(dir => NuGetVersion.TryParse(Path.GetFileName(dir), out var v) ? v : null)
                                                      .Where(t => t != null)
                                                      .Max();
                    if (maxVersion != null)
                    {
                        CodeModelGenerator.Instance.Emitter.Debug(
                            $"Using cached {refPackageName} v. {maxVersion.Version}.");
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

        /// <summary>
        /// Locates and parses the ApiCompat baseline (suppression) file for the current library, if
        /// present. The file is expected at <c>eng/apicompatbaselines/&lt;AssemblyName&gt;.xml</c> or
        /// <c>eng/apicompatbaselines/&lt;AssemblyName&gt;.txt</c> relative to a repository root
        /// discovered by walking up from the project directory. The XML format is preferred when both
        /// files exist.
        /// Returns <see cref="ApiCompatBaseline.Empty"/> when no baseline file is found.
        /// </summary>
        internal static ApiCompatBaseline LoadApiCompatBaseline()
        {
            var packageName = CodeModelGenerator.Instance.Configuration.PackageName;
            var directory = new DirectoryInfo(CodeModelGenerator.Instance.Configuration.ProjectDirectory);

            while (directory != null)
            {
                var baselineDirectory = Path.Combine(directory.FullName, "eng", "apicompatbaselines");
                foreach (var extension in new[] { ".xml", ".txt" })
                {
                    var candidate = Path.Combine(baselineDirectory, $"{packageName}{extension}");
                    if (File.Exists(candidate))
                    {
                        CodeModelGenerator.Instance.Emitter.Debug($"Loading ApiCompat baseline from {candidate}");
                        return ApiCompatBaseline.FromFile(candidate);
                    }
                }

                directory = directory.Parent;
            }

            return ApiCompatBaseline.Empty;
        }

        internal static async Task<Compilation?> LoadBaselineContract()
        {
            var packageName = CodeModelGenerator.Instance.Configuration.PackageName;
            string projectFilePath = Path.GetFullPath(Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, $"{packageName}.csproj"));

            if (!File.Exists(projectFilePath))
            {
                return null;
            }

            var projectRoot = ProjectRootElement.Open(projectFilePath);
            var baselineVersion = projectRoot.Properties.SingleOrDefault(p => p.Name == ApiCompatPropertyName)?.Value;
            if (baselineVersion == null)
            {
                return null;
            }

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
                    {
                        continue;
                    }

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
