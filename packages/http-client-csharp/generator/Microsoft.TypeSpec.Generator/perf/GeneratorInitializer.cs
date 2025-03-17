// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Reflection;

namespace Microsoft.TypeSpec.Generator.Perf
{
    internal static class GeneratorInitializer
    {
        public static void Initialize()
        {
            GeneratorHandler generatorHandler = new GeneratorHandler();
            generatorHandler.LoadGenerator(new CommandLineOptions
            {
                OutputDirectory = Path.Combine(Directory.GetParent(Assembly.GetExecutingAssembly().Location)!.FullName, "Projects", "Model"),
                GeneratorName = "CodeModelGenerator"
            });
        }
    }
}
