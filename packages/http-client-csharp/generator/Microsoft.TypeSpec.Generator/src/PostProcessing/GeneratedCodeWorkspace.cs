// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
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
                {
                    continue;
                }

                project = project.AddDocument(sourceFile, File.ReadAllText(sourceFile), folders ?? Array.Empty<string>(), sourceFile).Project;
            }

            return project;
        }

        /// <summary>
        /// Resolves the project's evaluated compiler references and adds their assemblies as metadata
        /// references so custom code and alternate types compile correctly.
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

            var nugetSettings = Settings.LoadDefaultSettings(projectFilePath);
            var globalPackagesFolder = SettingsUtility.GetGlobalPackagesFolder(nugetSettings);

            // Build a set of assembly names already registered so we can skip them
            var existingRefs = new HashSet<string>(
                CodeModelGenerator.Instance.AdditionalMetadataReferences
                    .Where(r => r.Display is not null)
                    .Select(r => Path.GetFileNameWithoutExtension(r.Display!))
                    .Where(n => !string.IsNullOrEmpty(n)),
                StringComparer.OrdinalIgnoreCase);

            foreach (var resolvedAssemblyPath in await FindEvaluatedMetadataReferences(projectFilePath))
            {
                AddMetadataReference(resolvedAssemblyPath, existingRefs);
            }

            // Fall back to direct project and package discovery when the project has not been restored and
            // ResolveReferences cannot produce the evaluated compiler reference graph.
            foreach (var resolvedAssemblyPath in await FindProjectReferenceAssemblies(projectFilePath))
            {
                AddMetadataReference(resolvedAssemblyPath, existingRefs);
            }

            foreach (var packageReference in await FindPackageReferences(projectFilePath))
            {
                var refPackageName = packageReference.Name;

                if (string.IsNullOrEmpty(refPackageName))
                {
                    continue;
                }

                // Search the NuGet global packages folder for any cached version of this package.
                string? resolvedAssemblyPath = NugetPackageResolver.FindPackageAssembly(
                    globalPackagesFolder,
                    refPackageName,
                    packageReference.Version);

                // If not found in cache, download the latest version from NuGet feeds
                if (resolvedAssemblyPath == null)
                {
                    try
                    {
                        var resolvedVersion = await NugetPackageResolver.ResolvePackageVersion(
                            refPackageName,
                            nugetSettings,
                            packageReference.Version);
                        if (resolvedVersion != null)
                        {
                            var downloader = new NugetPackageDownloader(refPackageName, resolvedVersion, null, nugetSettings);
                            var downloadedPath = await downloader.DownloadAndInstallPackage();
                            resolvedAssemblyPath = Directory.EnumerateFiles(
                                downloadedPath,
                                "*.dll",
                                SearchOption.TopDirectoryOnly).FirstOrDefault();
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
                    foreach (var assemblyPath in Directory.EnumerateFiles(
                        Path.GetDirectoryName(resolvedAssemblyPath)!,
                        "*.dll",
                        SearchOption.TopDirectoryOnly))
                    {
                        AddMetadataReference(assemblyPath, existingRefs);
                    }
                }
            }
        }

        private static void AddMetadataReference(string assemblyPath, ISet<string> existingRefs)
        {
            var assemblyName = Path.GetFileNameWithoutExtension(assemblyPath);
            if (!existingRefs.Add(assemblyName))
            {
                return;
            }

            CodeModelGenerator.Instance.AddMetadataReference(
                MetadataReference.CreateFromFile(assemblyPath));
            CodeModelGenerator.Instance.Emitter.Debug(
                $"Added metadata reference: {assemblyName} from {assemblyPath}");
        }

        private static async Task<IEnumerable<string>> FindEvaluatedMetadataReferences(string projectFilePath)
        {
            var targetFrameworks = await GetTargetFrameworks(projectFilePath);
            var candidates = new Dictionary<string, (string Path, bool IsCopyLocal)>(
                StringComparer.OrdinalIgnoreCase);

            foreach (var configuration in new[] { "Debug", "Release" })
            {
                foreach (var targetFramework in targetFrameworks)
                {
                    var arguments = new List<string>
                    {
                        $"-property:Configuration={configuration}",
                        "-property:BuildProjectReferences=false",
                        "-target:ResolveReferences",
                        "-getItem:ReferenceCopyLocalPaths,ReferencePath"
                    };
                    if (!string.IsNullOrEmpty(targetFramework))
                    {
                        arguments.Insert(1, $"-property:TargetFramework={targetFramework}");
                    }

                    var referencesJson = await RunMSBuildQuery(projectFilePath, [.. arguments]);
                    if (referencesJson == null)
                    {
                        continue;
                    }

                    using var references = JsonDocument.Parse(referencesJson);
                    if (!references.RootElement.TryGetProperty("Items", out var items))
                    {
                        continue;
                    }

                    foreach (var itemName in new[] { "ReferenceCopyLocalPaths", "ReferencePath" })
                    {
                        var isCopyLocal = itemName == "ReferenceCopyLocalPaths";
                        if (!items.TryGetProperty(itemName, out var referencePaths))
                        {
                            continue;
                        }

                        foreach (var reference in referencePaths.EnumerateArray())
                        {
                            if (reference.TryGetProperty("FrameworkReferenceName", out var frameworkReference)
                                && !string.IsNullOrEmpty(frameworkReference.GetString()))
                            {
                                continue;
                            }

                            if (reference.TryGetProperty("Identity", out var identity)
                                && identity.GetString() is { } assemblyPath
                                && File.Exists(assemblyPath))
                            {
                                var assemblyName = Path.GetFileNameWithoutExtension(assemblyPath);
                                if (!candidates.TryGetValue(assemblyName, out var current)
                                    || (isCopyLocal && !current.IsCopyLocal)
                                    || (isCopyLocal == current.IsCopyLocal
                                        && File.GetLastWriteTimeUtc(assemblyPath)
                                            > File.GetLastWriteTimeUtc(current.Path)))
                                {
                                    candidates[assemblyName] = (assemblyPath, isCopyLocal);
                                }
                            }
                        }
                    }
                }
            }

            return candidates.Values.Select(candidate => candidate.Path);
        }

        private static async Task<IEnumerable<string>> GetTargetFrameworks(string projectFilePath)
        {
            var propertiesJson = await RunMSBuildQuery(
                projectFilePath,
                "-getProperty:TargetFramework,TargetFrameworks");
            if (propertiesJson == null)
            {
                return [string.Empty];
            }

            using var properties = JsonDocument.Parse(propertiesJson);
            if (!properties.RootElement.TryGetProperty("Properties", out var propertyValues))
            {
                return [string.Empty];
            }

            var targetFrameworks = propertyValues.GetProperty(TargetFrameworksPropertyName).GetString();
            if (!string.IsNullOrEmpty(targetFrameworks))
            {
                return targetFrameworks.Split(
                    ';',
                    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            }

            var targetFramework = propertyValues.GetProperty(TargetFrameworkPropertyName).GetString();
            return string.IsNullOrEmpty(targetFramework) ? [string.Empty] : [targetFramework];
        }

        private static async Task<IEnumerable<(string Name, string? Version)>> FindPackageReferences(
            string projectFilePath)
        {
            var packageReferencesJson = await RunMSBuildQuery(
                projectFilePath,
                "-getItem:PackageReference,PackageVersion");
            if (packageReferencesJson == null)
            {
                return [];
            }

            using var packageReferences = JsonDocument.Parse(packageReferencesJson);
            if (!packageReferences.RootElement.TryGetProperty("Items", out var items)
                || !items.TryGetProperty("PackageReference", out var references))
            {
                return [];
            }

            var centralPackageVersions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (items.TryGetProperty("PackageVersion", out var packageVersions))
            {
                foreach (var packageVersion in packageVersions.EnumerateArray())
                {
                    if (packageVersion.TryGetProperty("Identity", out var identity)
                        && packageVersion.TryGetProperty("Version", out var version)
                        && identity.GetString() is { } packageName
                        && version.GetString() is { } packageVersionValue)
                    {
                        centralPackageVersions[packageName] = packageVersionValue;
                    }
                }
            }

            var result = new List<(string Name, string? Version)>();
            foreach (var packageReference in references.EnumerateArray())
            {
                if (!packageReference.TryGetProperty("Identity", out var identity)
                    || string.IsNullOrEmpty(identity.GetString()))
                {
                    continue;
                }

                var version = packageReference.TryGetProperty("VersionOverride", out var versionOverride)
                    && !string.IsNullOrEmpty(versionOverride.GetString())
                        ? versionOverride.GetString()
                        : packageReference.TryGetProperty("Version", out var packageVersion)
                            ? packageVersion.GetString()
                            : null;
                var packageName = identity.GetString()!;
                if (string.IsNullOrEmpty(version))
                {
                    centralPackageVersions.TryGetValue(packageName, out version);
                }
                result.Add((packageName, version));
            }

            return result;
        }

        private static Task<IEnumerable<string>> FindProjectReferenceAssemblies(string projectFilePath) =>
            FindProjectReferenceAssemblies(
                projectFilePath,
                new HashSet<string>(StringComparer.OrdinalIgnoreCase));

        private static async Task<IEnumerable<string>> FindProjectReferenceAssemblies(
            string projectFilePath,
            ISet<string> visitedProjects)
        {
            projectFilePath = Path.GetFullPath(projectFilePath);
            if (!visitedProjects.Add(projectFilePath))
            {
                return [];
            }

            var candidates = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var configuration in new[] { "Debug", "Release" })
            {
                var projectReferencesJson = await RunMSBuildQuery(
                    projectFilePath,
                    $"-property:Configuration={configuration}",
                    "-getItem:ProjectReference");
                if (projectReferencesJson == null)
                {
                    continue;
                }

                using var projectReferences = JsonDocument.Parse(projectReferencesJson);
                if (!projectReferences.RootElement.TryGetProperty("Items", out var items)
                    || !items.TryGetProperty("ProjectReference", out var references))
                {
                    continue;
                }

                foreach (var projectReference in references.EnumerateArray())
                {
                    if (projectReference.TryGetProperty("ReferenceOutputAssembly", out var referenceOutputAssembly)
                        && string.Equals(
                            referenceOutputAssembly.GetString(),
                            "false",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (!projectReference.TryGetProperty("FullPath", out var fullPath)
                        || string.IsNullOrEmpty(fullPath.GetString()))
                    {
                        continue;
                    }

                    foreach (var targetPath in await GetProjectTargetPaths(
                        fullPath.GetString()!,
                        configuration))
                    {
                        candidates.Add(targetPath);
                    }

                    foreach (var transitiveReference in await FindProjectReferenceAssemblies(
                        fullPath.GetString()!,
                        visitedProjects))
                    {
                        candidates.Add(transitiveReference);
                    }
                }
            }

            return candidates.OrderByDescending(File.GetLastWriteTimeUtc);
        }

        private static async Task<IEnumerable<string>> GetProjectTargetPaths(
            string projectFilePath,
            string configuration)
        {
            if (!File.Exists(projectFilePath))
            {
                return [];
            }

            var propertiesJson = await RunMSBuildQuery(
                projectFilePath,
                $"-property:Configuration={configuration}",
                "-getProperty:TargetPath,TargetFrameworks");
            if (propertiesJson == null)
            {
                return [];
            }

            using var properties = JsonDocument.Parse(propertiesJson);
            var propertyValues = properties.RootElement.GetProperty("Properties");
            var targetFrameworks = propertyValues.GetProperty(TargetFrameworksPropertyName).GetString();
            if (string.IsNullOrEmpty(targetFrameworks))
            {
                var targetPath = propertyValues.GetProperty("TargetPath").GetString();
                return !string.IsNullOrEmpty(targetPath) && File.Exists(targetPath)
                    ? [targetPath]
                    : [];
            }

            var candidates = new List<string>();
            foreach (var targetFramework in targetFrameworks.Split(
                ';',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var targetPath = await RunMSBuildQuery(
                    projectFilePath,
                    $"-property:Configuration={configuration}",
                    $"-property:TargetFramework={targetFramework}",
                    "-getProperty:TargetPath");
                var normalizedTargetPath = targetPath?.Trim();
                if (!string.IsNullOrEmpty(normalizedTargetPath) && File.Exists(normalizedTargetPath))
                {
                    candidates.Add(normalizedTargetPath);
                }
            }

            return candidates;
        }

        private static async Task<string?> RunMSBuildQuery(string projectFilePath, params string[] arguments)
        {
            var startInfo = new ProcessStartInfo("dotnet")
            {
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false
            };
            startInfo.ArgumentList.Add("msbuild");
            startInfo.ArgumentList.Add(projectFilePath);
            startInfo.ArgumentList.Add("-nologo");
            startInfo.ArgumentList.Add("-verbosity:quiet");
            foreach (var argument in arguments)
            {
                startInfo.ArgumentList.Add(argument);
            }

            using var process = Process.Start(startInfo);
            if (process == null)
            {
                return null;
            }

            var standardOutput = process.StandardOutput.ReadToEndAsync();
            var standardError = process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();
            if (process.ExitCode != 0)
            {
                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Could not evaluate project references for {projectFilePath}: {await standardError}");
                return null;
            }

            return await standardOutput;
        }

        /// <summary>
        /// Locates and parses the ApiCompat baseline (suppression) file for the current library, if
        /// present. The file is expected at <c>eng/apicompatbaselines/&lt;AssemblyName&gt;.txt</c>
        /// relative to a repository root discovered by walking up from the project directory.
        /// Returns <see cref="ApiCompatBaseline.Empty"/> when no baseline file is found.
        /// </summary>
        internal static ApiCompatBaseline LoadApiCompatBaseline()
        {
            var packageName = CodeModelGenerator.Instance.Configuration.PackageName;
            var directory = new DirectoryInfo(CodeModelGenerator.Instance.Configuration.ProjectDirectory);

            while (directory != null)
            {
                var candidate = Path.Combine(directory.FullName, "eng", "apicompatbaselines", $"{packageName}.txt");
                if (File.Exists(candidate))
                {
                    CodeModelGenerator.Instance.Emitter.Debug($"Loading ApiCompat baseline from {candidate}");
                    return ApiCompatBaseline.FromFile(candidate);
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
