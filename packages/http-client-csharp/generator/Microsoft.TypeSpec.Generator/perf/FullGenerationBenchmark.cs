// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using BenchmarkDotNet.Attributes;

namespace Microsoft.TypeSpec.Generator.Perf
{
    public class FullGenerationBenchmark
    {
        private const string ProfileEnvironmentVariable = "POSTPROCESSING_BENCHMARK_PROFILE_STEPS";
        private const string ProfileOutputDirectoryEnvironmentVariable = "POSTPROCESSING_BENCHMARK_PROFILE_DIR";

        private bool _profileSteps;

        [GlobalSetup]
        public void GlobalSetup()
        {
            _profileSteps = string.Equals(
                Environment.GetEnvironmentVariable(ProfileEnvironmentVariable),
                "true",
                StringComparison.OrdinalIgnoreCase);
        }

        [Benchmark]
        public async Task<int> GenerateSampleTypeSpecProject()
        {
            var postProcessingProfile = _profileSteps ? new GeneratedCodeWorkspacePostProcessingProfile() : null;
            var generationProfile = _profileSteps ? new GeneratedCodeWorkspacePostProcessingProfile() : null;
            GeneratedCodeWorkspace.PostProcessingProfile = postProcessingProfile;
            CSharpGen.GenerationProfile = generationProfile;

            var benchmarkDirectory = CreateBenchmarkInputDirectory();
            var stopwatch = Stopwatch.StartNew();
            try
            {
                CodeModelGenerator.Instance = new BenchmarkCodeModelGenerator(benchmarkDirectory);
                CodeModelGenerator.Instance.Configure();

                var csharpGen = new CSharpGen();
                await csharpGen.ExecuteAsync();

                return Directory.GetFiles(benchmarkDirectory, "*", SearchOption.AllDirectories)
                    .Where(static path => !path.EndsWith("tspCodeModel.json", StringComparison.Ordinal) &&
                        !path.EndsWith("Configuration.json", StringComparison.Ordinal))
                    .Sum(static path => (int)new FileInfo(path).Length);
            }
            finally
            {
                stopwatch.Stop();
                if (generationProfile != null)
                {
                    WriteProfile(
                        generationProfile,
                        $"full-generation-profile-{DateTime.UtcNow:yyyyMMddHHmmssfff}.csv",
                        $"Full generation invocation elapsed ms: {stopwatch.Elapsed.TotalMilliseconds:F3}{Environment.NewLine}" +
                        $"Input directory: {benchmarkDirectory}{Environment.NewLine}");
                }

                if (postProcessingProfile != null)
                {
                    WriteProfile(
                        postProcessingProfile,
                        $"full-generation-post-processing-profile-{DateTime.UtcNow:yyyyMMddHHmmssfff}.csv",
                        $"Full generation post-processing profile{Environment.NewLine}" +
                        $"Input directory: {benchmarkDirectory}{Environment.NewLine}");
                }

                CSharpGen.GenerationProfile = null;
                GeneratedCodeWorkspace.PostProcessingProfile = null;
                TryDeleteDirectory(benchmarkDirectory);
            }
        }

        private static void WriteProfile(GeneratedCodeWorkspacePostProcessingProfile profile, string fileName, string header)
        {
            var profileDirectory = GetProfileOutputDirectory();
            Directory.CreateDirectory(profileDirectory);
            File.WriteAllText(Path.Combine(profileDirectory, fileName), header + profile.GetSummary());
        }

        private static string CreateBenchmarkInputDirectory()
        {
            var sourceDirectory = FindFullGenerationInputDirectory();
            var benchmarkDirectory = Path.Combine(Path.GetTempPath(), "typespec-full-generation-benchmark", Guid.NewGuid().ToString("N"));
            CopyDirectory(sourceDirectory, benchmarkDirectory);
            return benchmarkDirectory;
        }

        private static string FindFullGenerationInputDirectory()
        {
            const string relativePath = "packages/http-client-csharp/generator/TestProjects/Local/Sample-TypeSpec";

            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory != null)
            {
                var inputDirectory = Path.Combine(directory.FullName, relativePath);
                if (File.Exists(Path.Combine(inputDirectory, "tspCodeModel.json")) &&
                    File.Exists(Path.Combine(inputDirectory, "Configuration.json")))
                {
                    return inputDirectory;
                }

                directory = directory.Parent;
            }

            throw new DirectoryNotFoundException($"Could not find '{relativePath}' from '{AppContext.BaseDirectory}'.");
        }

        private static void CopyDirectory(string sourceDirectory, string destinationDirectory)
        {
            Directory.CreateDirectory(destinationDirectory);
            foreach (var sourceFile in Directory.GetFiles(sourceDirectory, "*", SearchOption.AllDirectories))
            {
                var relativePath = Path.GetRelativePath(sourceDirectory, sourceFile);
                var destinationFile = Path.Combine(destinationDirectory, relativePath);
                Directory.CreateDirectory(Path.GetDirectoryName(destinationFile)!);
                File.Copy(sourceFile, destinationFile, overwrite: true);
            }
        }

        private static void TryDeleteDirectory(string directory)
        {
            try
            {
                if (Directory.Exists(directory))
                {
                    Directory.Delete(directory, recursive: true);
                }
            }
            catch
            {
                // Best-effort cleanup for benchmark temp output.
            }
        }

        private static string GetProfileOutputDirectory()
        {
            var configuredPath = Environment.GetEnvironmentVariable(ProfileOutputDirectoryEnvironmentVariable);
            return string.IsNullOrWhiteSpace(configuredPath)
                ? Path.Combine(Path.GetTempPath(), "typespec-post-processing-profiles")
                : Path.GetFullPath(configuredPath);
        }

        private sealed class BenchmarkCodeModelGenerator : CodeModelGenerator
        {
            public BenchmarkCodeModelGenerator(string outputPath)
                : base(new GeneratorContext(Configuration.Load(outputPath)))
            {
            }
        }
    }
}
