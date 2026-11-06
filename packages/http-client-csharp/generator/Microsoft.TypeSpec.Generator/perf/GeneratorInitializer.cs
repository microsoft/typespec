// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.TypeSpec.Generator.SourceInput;

namespace Microsoft.TypeSpec.Generator.Perf
{
    internal static class GeneratorInitializer
    {
        public static void Initialize()
        {
            // Microbenchmarks need the base generator, not plugin discovery across
            // every assembly in the benchmark/test output directory.
            var outputPath = Path.Combine(AppContext.BaseDirectory, "Projects", "Model");
            CodeModelGenerator.Instance = new BenchmarkCodeModelGenerator(outputPath);
            CodeModelGenerator.Instance.Configure();
            CodeModelGenerator.Instance.SourceInputModel = new SourceInputModel(null, null);
        }

        private sealed class BenchmarkCodeModelGenerator(string outputPath)
            : CodeModelGenerator(new GeneratorContext(Configuration.Load(outputPath)))
        {
        }
    }
}
