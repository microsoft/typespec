// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.Threading.Tasks;
using CommandLine;

namespace Microsoft.Generator.CSharp
{
    internal static class Program
    {
        public static async Task<int> Main(string[] args)
        {
            GeneratorRunner runner = new GeneratorRunner();

            // If no arguments are passed, show help message
            if (args.Length == 0)
            {
                args = new[] { "--help" };
            }

            return await Parser.Default.ParseArguments<CommandLineOptions>(args)
                .MapResult(async (CommandLineOptions opts) =>
                {
                    return await Run(opts, runner);
                },
                errs => Task.FromResult(-1));
        }

        private static async Task<int> Run(CommandLineOptions options, GeneratorRunner runner)
        {
            if (options.ShouldDebug)
            {
                await Console.Error.WriteLineAsync("Attempting to attach debugger..");
                Debugger.Launch();
            }

            try
            {
                await runner.RunAsync(options);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error: {ex.Message}: {ex.StackTrace}");
                return 1;
            }

            Console.Error.WriteLine("Shutting Down");
            return 0;
        }
    }
}
