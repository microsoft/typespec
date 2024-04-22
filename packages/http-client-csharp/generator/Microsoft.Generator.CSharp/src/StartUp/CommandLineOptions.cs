// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;
using System.IO;
using CommandLine;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Options for the command line when running the generator.
    /// </summary>
    internal class CommandLineOptions
    {
        private const string OutputDirectoryOptionName = "DIRECTORY";
        private const string ModelPluginOptionName = "model-plugin";
        private const string ShouldDebugOptionName = "debug";
        private const string CmdLineOutputDirectoryOptionHelpText = "The path to the directory containing the input files to the generator including the code model file and the configuration file for the generator.";
        private const string CmdLineModelPluginOptionHelpText = "The name of the custom client model plugin NuGet package to use to generate the code. If not provided, the default client model plugin package `Microsoft.Generator.CSharp.ClientModel` will be used.";
        private const string CmdLineDebugOptionHelpText = "Attempt to attach the debugger on execute.";

        /// <summary>
        /// The command line option to specify the path to the directory containing the input files to the generator.
        /// </summary>
        [Value(0, MetaName = OutputDirectoryOptionName, Default = null, Required = true, HelpText = CmdLineOutputDirectoryOptionHelpText)]
        [NotNull]
        public string? OutputDirectory { get; set; }

        /// <summary>
        /// The command line option to specify the name of the custom client model plugin Nuget package to use to generate the client.
        /// </summary>
        [Option(ModelPluginOptionName, Required = false, Default = null, HelpText = CmdLineModelPluginOptionHelpText)]
        public string? ModelPlugin { get; set; }

        [Option(longName: ShouldDebugOptionName, Required = false, Default = false, Hidden = true, HelpText = CmdLineDebugOptionHelpText)]
        public bool ShouldDebug { get; set; }
    }
}
