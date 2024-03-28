// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using CommandLine;

namespace AutoRest.CSharp
{
    internal class CommandLineOptions
    {
        [Option('p', "project-path", SetName = "basePath", Required = false, Default = null, HelpText = "Path to the project directory.  This is used instead of --standalone")]
        public string? ProjectPath { get; set; }

        [Option(longName: "existing-project-folder", Required = false, Default = null, HelpText = "Existing project folder.")]
        public string? ExistingProjectFolder { get; set; }

        [Option('s', "standalone", SetName = "basePath", Required = false, Default = null, HelpText = "Path to the generated directory.")]
        public string? Standalone { get; set; }

        [Option('c', "configuration", Required = false, Default = null, HelpText = "Path to the configuration file.")]
        public string? ConfigurationPath { get; set; }

        [Option('n', "new-project", Required = false, Default = false, HelpText = "Generate a new solution folder and project files.")]
        public bool IsNewProject { get; set; }

        [Option(longName: "debug", Required = false, Default = false, Hidden = true, HelpText = "Attempt to attach the debugger on execute.")]
        public bool ShouldDebug { get; set; }

        [Option(longName: "server", Required = false, Default = null, HelpText = "Server argument.")]
        public string? Server { get; set; }

        [Option('x', "clear-output-folder", Required = false, Default = false, HelpText = "Clear the output folder before generating code.")]
        public bool ClearOutputFolder { get; set; }

        [Option('b', "branded", Required = false, Default = true, HelpText = "Creates an Azure branded client.")]
        public bool IsBranded { get; set; }
    }
}
