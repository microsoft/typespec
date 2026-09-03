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

        internal static async Task<Dictionary<string, Dictionary<string, string>>> ReadProjectAssets()
        {
            Dictionary<string, Dictionary<string, string>> hshFrameworks = [];

            // Read in the resolved direct dependencies.

            // We first try the default location of project.assets.json, which is %project_dir%/obj/.
            string? assetsJson = await GetAssetFileOrNull();
            if (string.IsNullOrEmpty(assetsJson) || !File.Exists(assetsJson))
            {
                return hshFrameworks;
            }
            Utf8JsonReader reader = new Utf8JsonReader(await File.ReadAllBytesAsync(assetsJson));
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            foreach (JsonProperty prop in document.RootElement.EnumerateObject())
            {
                if (prop.Value.ValueKind == JsonValueKind.Object && prop.NameEquals("targets"))
                {
                    foreach (JsonProperty targetFramework in prop.Value.EnumerateObject())
                    {
                        NuGetFramework currentFramework = NuGetFramework.ParseFolder(targetFramework.Name);
                        if (!hshFrameworks.ContainsKey(currentFramework.GetShortFolderName()))
                        {
                            hshFrameworks[currentFramework.GetShortFolderName()] = [];
                        }
                        if (targetFramework.Value.ValueKind == JsonValueKind.Object)
                        {
                            // Parse dependencies. They are structured as SomePackage/package.version
                            foreach (JsonProperty packageAndVersion in targetFramework.Value.EnumerateObject())
                            {
                                string[] packageVersion = packageAndVersion.Name.Split('/');
                                if (packageVersion.Length == 2)
                                {
                                    hshFrameworks[currentFramework.GetShortFolderName()][packageVersion[0].ToLower()] = packageVersion[1];
                                }
                            }
                        }
                    }
                }
                // Centrally managed packages are stored in projectFileDependencyGroups; they are not present in targets
                if (prop.Value.ValueKind == JsonValueKind.Object && prop.NameEquals("projectFileDependencyGroups"))
                {
                    foreach (JsonProperty targetFramework in prop.Value.EnumerateObject())
                    {
                        NuGetFramework currentFramework = NuGetFramework.ParseFolder(targetFramework.Name);
                        if (!hshFrameworks.ContainsKey(currentFramework.GetShortFolderName()))
                        {
                            hshFrameworks[currentFramework.GetShortFolderName()] = [];
                        }
                        if (targetFramework.Value.ValueKind == JsonValueKind.Array)
                        {
                            // Parse dependencies. They are structured as SomePackage/package.version
                            foreach (JsonElement packageAndVersion in targetFramework.Value.EnumerateArray())
                            {
                                if (packageAndVersion.ValueKind == JsonValueKind.String)
                                {
                                    string[] packageVersionRelation = (packageAndVersion.GetString() ?? "").Split();
                                    // We only support the greater-than-or-equal relation, in other cases we only record the package.
                                    // Example: "My.Package >= 1.1.1"
                                    string packageName = packageVersionRelation[0].ToLower();
                                    if (!string.IsNullOrEmpty(packageName) && !hshFrameworks[currentFramework.GetShortFolderName()].ContainsKey(packageName))
                                    {
                                        if (packageVersionRelation.Length == 3 && string.Equals(packageVersionRelation[1], ">="))
                                        {
                                            hshFrameworks[currentFramework.GetShortFolderName()][packageName] = packageVersionRelation[2];
                                        }
                                        else
                                        {
                                            hshFrameworks[currentFramework.GetShortFolderName()][packageName] = "";
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return hshFrameworks;
        }

        internal static async Task<string?> GetAssetFileOrNull()
        {
            string projectFilePath = Path.GetFullPath(
                Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, $"{CodeModelGenerator.Instance.Configuration.PackageName}.csproj"));
            if (!File.Exists(projectFilePath))
            {
                return null;
            }
            Process restore = new();
            ProcessStartInfo info = new()
            {
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden,
                FileName = "dotnet",
                ArgumentList = { "msbuild", projectFilePath, "-getProperty:ProjectAssetsFile" },
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };
            restore.StartInfo = info;
            string? output = default;
            if (restore.Start())
            {
                Task<string> outputTask = restore.StandardOutput.ReadToEndAsync();
                Task<string> errorTask = restore.StandardError.ReadToEndAsync();
                await restore.WaitForExitAsync();
                output = await outputTask;
                string error = await errorTask;
                if (restore.ExitCode != 0)
                {
                    CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                        code: "unable-to-get-artifact-path",
                        message: $"The dotnet msbuild {projectFilePath} -getProperty:ProjectAssetsFile command exited with {restore.ExitCode}.\n" +
                        $"Standard output: {output}\n" +
                        $"Error output: {error}",
                        severity: EmitterRpc.EmitterDiagnosticSeverity.Warning
                    );
                }
            }
            return output?.Trim(['\n', '\r', '\t', ' ']);
        }

        internal static string GetLatestTargetFramework(IEnumerable<string> shortNames)
        {
            // Assume framework order as follows:
            // netstandardX.X, net462, netX.X
            // Q: Why not to use NuGetFramework object here?
            // A: Because it does not parse/recognize version and under the hood tries to compare Versions, which are all 0.0.0.
            double maxFramework = 0.0;
            string maxFrameworkName = string.Empty;
            foreach (string name in shortNames)
            {
                double current = 0.0;
                Match numeral = Regex.Match(name, "\\d+[.]*\\d*$");
                if (numeral.Success)
                {
                    current = double.Parse(numeral.Value, System.Globalization.CultureInfo.InvariantCulture);
                }
                if (name.StartsWith("net4", StringComparison.InvariantCultureIgnoreCase))
                {
                    current /= 100;
                    current += 2000.0;
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
                        severity: EmitterRpc.EmitterDiagnosticSeverity.Warning
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
            Dictionary<string, Dictionary<string, string>> hshFrameworks = await ReadProjectAssets();
            // Get the latest framework.
            Dictionary<string, string> hshNameVersion = [];
            if (hshFrameworks.Count > 0)
            {
                // Mimic the behavior of NugetPackageResolver.FindPackageAssemblyInVersion here
                // when selecting Framefork i.e. select the framework from the ones
                // supported by the project to the one currently running.
                string? frameworkName = AppContext.TargetFrameworkName;
                NuGetFramework? currentFramework = null;
                if (!string.IsNullOrEmpty(frameworkName))
                {
                    try
                    {
                        currentFramework = NuGetFramework.Parse(frameworkName);
                    }
                    catch (ArgumentException)
                    {
                        // Fall through to the runtime-version based approximation below.
                    }
                }
                currentFramework = currentFramework ?? NuGetFramework.Parse($".NETCoreApp,Version=v{Environment.Version.Major}.{Environment.Version.Minor}");
                NuGetFramework? nearest = new FrameworkReducer().GetNearest(currentFramework, hshFrameworks.Keys.Select(x => NuGetFramework.ParseFolder(x)));
                string bestFramework = nearest?.GetShortFolderName() ?? GetLatestTargetFramework(hshFrameworks.Keys.AsEnumerable());
                hshNameVersion = hshFrameworks[bestFramework];
            }
            // Build a set of assembly names already registered so we can skip them
            var existingRefs = new HashSet<string>(
            CodeModelGenerator.Instance.AdditionalMetadataReferences
                .Where(r => r.Display is not null)
                .Select(r => Path.GetFileNameWithoutExtension(r.Display!))
                .Where(n => !string.IsNullOrEmpty(n)),
            StringComparer.OrdinalIgnoreCase);

            foreach (string refPackageName in hshNameVersion.Keys)
            {
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
                string version = hshNameVersion[refPackageName];
                string? resolvedAssemblyPath = string.IsNullOrEmpty(version)
                     ? NugetPackageResolver.FindPackageAssembly(globalPackagesFolder, refPackageName)
                     : NugetPackageResolver.FindPackageAssemblyInVersion(globalPackagesFolder, refPackageName, version);
                if (resolvedAssemblyPath == null)
                {
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"The package {refPackageName}{(version != null ? " v. "+ version : "")} was not restored.");
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
