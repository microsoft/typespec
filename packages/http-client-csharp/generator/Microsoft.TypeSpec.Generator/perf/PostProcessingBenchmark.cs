// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using BenchmarkDotNet.Attributes;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Perf
{
    public class PostProcessingBenchmark
    {
        private const string GeneratedDirectoryEnvironmentVariable = "POSTPROCESSING_BENCHMARK_GENERATED_DIR";
        private const string ProfileEnvironmentVariable = "POSTPROCESSING_BENCHMARK_PROFILE_STEPS";
        private const string ProfileOutputDirectoryEnvironmentVariable = "POSTPROCESSING_BENCHMARK_PROFILE_DIR";
        private static readonly Regex NamespaceDeclarationRegex = new(
            @"\bnamespace\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)",
            RegexOptions.Compiled);

        [Params(1, 5)]
        public int CorpusMultiplier { get; set; }

        private (string Name, string Content)[] _generatedFiles = [];
        private bool _profileSteps;

        [GlobalSetup]
        public void GlobalSetup()
        {
            InitializeGenerator();

            var generatedDirectory = FindGeneratedDirectory();
            var sourceFiles = Directory.GetFiles(generatedDirectory, "*.cs", SearchOption.AllDirectories)
                .OrderBy(static path => path, StringComparer.Ordinal)
                .ToArray();

            if (sourceFiles.Length == 0)
            {
                throw new InvalidOperationException($"No generated C# files found under '{generatedDirectory}'.");
            }

            var declaredNamespaces = GetDeclaredNamespaces(sourceFiles);
            _generatedFiles = BuildCorpus(generatedDirectory, sourceFiles, declaredNamespaces);
            _profileSteps = string.Equals(
                Environment.GetEnvironmentVariable(ProfileEnvironmentVariable),
                "true",
                StringComparison.OrdinalIgnoreCase);
        }

        [Benchmark]
        public async Task<int> ProcessSampleTypeSpecGeneratedFiles()
        {
            var profile = _profileSteps ? new GeneratedCodeWorkspacePostProcessingProfile() : null;
            GeneratedCodeWorkspace.PostProcessingProfile = profile;

            var stopwatch = Stopwatch.StartNew();
            GeneratedCodeWorkspace.Initialize();
            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);

            try
            {
                foreach (var file in _generatedFiles)
                {
                    await workspace.AddGeneratedFile(new CodeFile(file.Content, file.Name));
                }

                var totalLength = 0;
                await foreach (var file in workspace.GetGeneratedFilesAsync())
                {
                    totalLength += file.Text.Length;
                }

                return totalLength;
            }
            finally
            {
                stopwatch.Stop();
                if (profile != null)
                {
                    WriteProfile(
                        profile,
                        $"post-processing-profile-RoslynSimplifier-x{CorpusMultiplier}-{DateTime.UtcNow:yyyyMMddHHmmssfff}.csv",
                        $"Reduction strategy: RoslynSimplifier{Environment.NewLine}" +
                        $"Corpus multiplier: {CorpusMultiplier}{Environment.NewLine}" +
                        $"File count: {_generatedFiles.Length}{Environment.NewLine}" +
                        $"Benchmark invocation elapsed ms: {stopwatch.Elapsed.TotalMilliseconds:F3}{Environment.NewLine}");
                }

                GeneratedCodeWorkspace.PostProcessingProfile = null;
            }
        }

        private static void WriteProfile(GeneratedCodeWorkspacePostProcessingProfile profile, string fileName, string header)
        {
            var profileDirectory = GetProfileOutputDirectory();
            Directory.CreateDirectory(profileDirectory);
            File.WriteAllText(Path.Combine(profileDirectory, fileName), header + profile.GetSummary());
        }

        private static string GetProfileOutputDirectory()
        {
            var configuredPath = Environment.GetEnvironmentVariable(ProfileOutputDirectoryEnvironmentVariable);
            return string.IsNullOrWhiteSpace(configuredPath)
                ? Path.Combine(Path.GetTempPath(), "typespec-post-processing-profiles")
                : Path.GetFullPath(configuredPath);
        }

        private (string Name, string Content)[] BuildCorpus(string generatedDirectory, string[] sourceFiles, IReadOnlyList<string> declaredNamespaces)
        {
            var generatedFiles = new List<(string Name, string Content)>(sourceFiles.Length * CorpusMultiplier);
            for (var i = 0; i < CorpusMultiplier; i++)
            {
                var namespaceSuffix = CorpusMultiplier == 1 ? string.Empty : $".BenchmarkCopy{i}";
                var folderPrefix = CorpusMultiplier == 1 ? string.Empty : $"BenchmarkCopy{i}";
                foreach (var path in sourceFiles)
                {
                    var relativePath = Path.GetRelativePath(generatedDirectory, path);
                    var content = File.ReadAllText(path);
                    if (CorpusMultiplier > 1)
                    {
                        content = MakeNamespacesUnique(content, declaredNamespaces, namespaceSuffix);
                    }

                    generatedFiles.Add((Path.Combine(folderPrefix, relativePath), content));
                }
            }

            return generatedFiles.ToArray();
        }

        private static IReadOnlyList<string> GetDeclaredNamespaces(string[] sourceFiles)
        {
            var declaredNamespaces = sourceFiles
                .SelectMany(static path => NamespaceDeclarationRegex.Matches(File.ReadAllText(path)))
                .Select(static match => match.Groups[1].Value)
                .Distinct(StringComparer.Ordinal)
                .ToArray();

            return declaredNamespaces
                .Where(ns => !declaredNamespaces.Any(candidate =>
                    !string.Equals(ns, candidate, StringComparison.Ordinal) &&
                    ns.StartsWith(candidate + ".", StringComparison.Ordinal)))
                .OrderByDescending(static ns => ns.Length)
                .ToArray();
        }

        private static string MakeNamespacesUnique(string content, IReadOnlyList<string> declaredNamespaces, string namespaceSuffix)
        {
            foreach (var declaredNamespace in declaredNamespaces)
            {
                var escapedNamespace = Regex.Escape(declaredNamespace);
                content = content.Replace($"global::{declaredNamespace}.", $"global::{declaredNamespace}{namespaceSuffix}.", StringComparison.Ordinal);
                content = Regex.Replace(
                    content,
                    $@"(?<![A-Za-z0-9_:]){escapedNamespace}(?=\.)",
                    $"{declaredNamespace}{namespaceSuffix}");
                content = Regex.Replace(
                    content,
                    $@"\b(namespace|using)\s+{escapedNamespace}(?=\s|;)",
                    $"$1 {declaredNamespace}{namespaceSuffix}");
            }

            return content;
        }

        private static string FindGeneratedDirectory()
        {
            var configuredPath = Environment.GetEnvironmentVariable(GeneratedDirectoryEnvironmentVariable);
            if (!string.IsNullOrWhiteSpace(configuredPath))
            {
                var fullPath = Path.GetFullPath(configuredPath);
                if (!Directory.Exists(fullPath))
                {
                    throw new DirectoryNotFoundException($"The directory configured by {GeneratedDirectoryEnvironmentVariable} does not exist: '{fullPath}'.");
                }

                return fullPath;
            }

            const string relativePath = "packages/http-client-csharp/generator/TestProjects/Local/Sample-TypeSpec/src/Generated";

            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory != null)
            {
                var generatedDirectory = Path.Combine(directory.FullName, relativePath);
                if (Directory.Exists(generatedDirectory))
                {
                    return generatedDirectory;
                }

                directory = directory.Parent;
            }

            throw new DirectoryNotFoundException($"Could not find '{relativePath}' from '{AppContext.BaseDirectory}'.");
        }

        private static void InitializeGenerator()
        {
            var outputPath = Path.Combine(AppContext.BaseDirectory, "PostProcessingBenchmark");
            Directory.CreateDirectory(outputPath);

            var generator = new BenchmarkCodeModelGenerator(outputPath);
            foreach (var referencePath in GetMetadataReferencePaths())
            {
                generator.AddMetadataReference(MetadataReference.CreateFromFile(referencePath));
            }

            CodeModelGenerator.Instance = generator;
        }

        private static IEnumerable<string> GetMetadataReferencePaths()
        {
            HashSet<string> referencePaths = new(StringComparer.OrdinalIgnoreCase);

            if (AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") is string trustedPlatformAssemblies)
            {
                foreach (var referencePath in trustedPlatformAssemblies.Split(Path.PathSeparator))
                {
                    if (referencePaths.Add(referencePath))
                    {
                        yield return referencePath;
                    }
                }
            }

            foreach (var referencePath in Directory.GetFiles(AppContext.BaseDirectory, "*.dll", SearchOption.TopDirectoryOnly))
            {
                if (referencePaths.Add(referencePath))
                {
                    yield return referencePath;
                }
            }
        }

        private sealed class BenchmarkCodeModelGenerator : CodeModelGenerator
        {
            public BenchmarkCodeModelGenerator(string outputPath)
                : base(new GeneratorContext(Configuration.Load(outputPath, "{\"package-name\":\"Sample.TypeSpec\",\"disable-xml-docs\":false}")))
            {
            }
        }
    }
}
