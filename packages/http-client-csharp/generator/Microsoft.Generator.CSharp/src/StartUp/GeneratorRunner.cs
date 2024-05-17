// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;

namespace Microsoft.Generator.CSharp
{
    internal class GeneratorRunner
    {
        public async Task RunAsync(CommandLineOptions options) => await RunAsync(options, null);

        internal async Task RunAsync(CommandLineOptions options, CodeModelPlugin? plugin)
        {
            PluginHandler pluginHandler = new();
            pluginHandler.LoadPlugin(options.OutputDirectory, plugin);

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
        }
    }
}
