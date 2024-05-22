// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;

namespace Microsoft.Generator.CSharp
{
    internal class GeneratorRunner
    {
        public async Task RunAsync(CommandLineOptions options)
        {
            var configuration = Configuration.Load(options.OutputDirectory);
            CodeModelPlugin.LoadPlugins(configuration);

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
        }
    }
}
