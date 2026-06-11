// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using BenchmarkDotNet.Attributes;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;

namespace Microsoft.TypeSpec.Generator.Perf
{
    public class GeneratedCodeWorkspaceNameResolverBenchmark
    {
        private TypeProvider[] _providers = [];
        [Params(100)]
        public int ModelCount { get; set; }

        [Params(10)]
        public int PropertyCount { get; set; }

        [GlobalSetup]
        public void Setup()
        {
            var outputPath = Path.Combine(Path.GetTempPath(), "Microsoft.TypeSpec.Generator.Perf", nameof(GeneratedCodeWorkspaceNameResolverBenchmark));
            Directory.CreateDirectory(outputPath);

            var inputModels = new List<InputModelType>(ModelCount);
            for (int i = 0; i < ModelCount; i++)
            {
                inputModels.Add(CreateModel(i));
            }

            var generator = new BenchmarkCodeModelGenerator(new GeneratorContext(Configuration.Load(
                outputPath,
                """
                {
                    "package-name": "Benchmark"
                }
                """)),
                InputFactory.Namespace("Benchmark", models: [.. inputModels]));
            generator.SourceInputModel = new SourceInputModel(null, null);
            CodeModelGenerator.Instance = generator;

            var providers = new List<TypeProvider>(ModelCount);
            foreach (var inputModel in inputModels)
            {
                providers.Add(new ModelProvider(inputModel));
            }

            _providers = [.. providers];
        }

        [Benchmark(Baseline = true)]
        public Task<int> LegacyWriterWithRoslynSimplifier()
            => WriteAndPostProcessAsync(resolveTypeNames: false);

        [Benchmark]
        public Task<int> OptimizedWriterWithoutRoslynSimplifier()
            => WriteAndPostProcessAsync(resolveTypeNames: true);

        private async Task<int> WriteAndPostProcessAsync(bool resolveTypeNames)
        {
            CodeModelGenerator.Instance.ShouldResolveTypeNames = resolveTypeNames;

            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
            foreach (var provider in _providers)
            {
                await workspace.AddGeneratedFile(new TypeProviderWriter(provider).Write());
            }

            var totalLength = 0;
            await foreach (var (_, text) in workspace.GetGeneratedFilesAsync())
            {
                totalLength += text.Length;
            }

            return totalLength;
        }

        private InputModelType CreateModel(int modelIndex)
        {
            var properties = new List<InputModelProperty>(PropertyCount);
            for (int i = 0; i < PropertyCount; i++)
            {
                properties.Add(InputFactory.Property($"property{i}", GetPropertyType(i), isRequired: true));
            }

            return InputFactory.Model($"BenchmarkModel{modelIndex}", properties: properties);
        }

        private static InputType GetPropertyType(int propertyIndex)
            => (propertyIndex % 4) switch
            {
                0 => InputPrimitiveType.String,
                1 => InputPrimitiveType.Int32,
                2 => InputFactory.Array(InputPrimitiveType.String),
                _ => InputFactory.Dictionary(InputPrimitiveType.Int32),
            };

        private sealed class BenchmarkCodeModelGenerator : CodeModelGenerator
        {
            private readonly InputLibrary _inputLibrary;

            public BenchmarkCodeModelGenerator(GeneratorContext context, InputNamespace inputNamespace)
                : base(context)
            {
                _inputLibrary = new BenchmarkInputLibrary(inputNamespace);
            }

            public override InputLibrary InputLibrary => _inputLibrary;
        }

        private sealed class BenchmarkInputLibrary : InputLibrary
        {
            private readonly InputNamespace _inputNamespace;

            public BenchmarkInputLibrary(InputNamespace inputNamespace)
            {
                _inputNamespace = inputNamespace;
            }

            public override InputNamespace InputNamespace => _inputNamespace;
        }
    }
}
