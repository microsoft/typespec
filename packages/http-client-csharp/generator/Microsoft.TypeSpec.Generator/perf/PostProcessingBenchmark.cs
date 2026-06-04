// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using BenchmarkDotNet.Attributes;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Perf
{
    public class PostProcessingBenchmark
    {
        private (string Name, string Content)[] _generatedFiles = [];

        [GlobalSetup]
        public void GlobalSetup()
        {
            InitializeGenerator();

            var generatedDirectory = FindSampleTypeSpecGeneratedDirectory();
            _generatedFiles = Directory.GetFiles(generatedDirectory, "*.cs", SearchOption.AllDirectories)
                .OrderBy(static path => path, StringComparer.Ordinal)
                .Select(path => (Name: Path.GetRelativePath(generatedDirectory, path), Content: File.ReadAllText(path)))
                .ToArray();

            if (_generatedFiles.Length == 0)
            {
                throw new InvalidOperationException($"No generated C# files found under '{generatedDirectory}'.");
            }
        }

        [Benchmark]
        public async Task<int> ProcessSampleTypeSpecGeneratedFiles()
        {
            GeneratedCodeWorkspace.Initialize();
            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);

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

        private static string FindSampleTypeSpecGeneratedDirectory()
        {
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
