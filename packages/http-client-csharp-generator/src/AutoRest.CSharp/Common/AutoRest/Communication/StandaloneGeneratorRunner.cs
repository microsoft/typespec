// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.CSharp.AutoRest.Plugins;
using AutoRest.CSharp.Common.AutoRest.Plugins;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.AutoRest.Communication
{
    internal class StandaloneGeneratorRunner
    {
        private static readonly string[] keepFiles = new string[] { "CodeModel.yaml", "Configuration.json", "tspCodeModel.json" };
        public static async Task RunAsync(CommandLineOptions options)
        {
            string? projectPath = null;
            string outputPath;
            string generatedTestOutputPath;
            bool wasProjectPathPassedIn = options.ProjectPath is not null;
            if (options.Standalone is not null)
            {
                //TODO this is only here for back compat we should consider removing it
                outputPath = options.Standalone;
            }
            else
            {
                projectPath = options.ProjectPath!;
                if (!projectPath!.EndsWith("src", StringComparison.Ordinal))
                    projectPath = Path.Combine(projectPath, "src");
                outputPath = Path.Combine(projectPath, "Generated");
            }
            generatedTestOutputPath = Path.Combine(outputPath, "..", "..", "tests", "Generated");

            var configurationPath = options.ConfigurationPath ?? Path.Combine(outputPath, "Configuration.json");
            LoadConfiguration(projectPath, outputPath, options.ExistingProjectFolder, File.ReadAllText(configurationPath));

            var codeModelInputPath = Path.Combine(outputPath, "CodeModel.yaml");
            var tspInputFile = Path.Combine(outputPath, "tspCodeModel.json");

            GeneratedCodeWorkspace workspace;
            if (File.Exists(tspInputFile))
            {
                var json = await File.ReadAllTextAsync(tspInputFile);
                var rootNamespace = TypeSpecSerialization.Deserialize(json) ?? throw new InvalidOperationException($"Deserializing {tspInputFile} has failed.");
                workspace = await new CSharpGen().ExecuteAsync(rootNamespace);
                if (options.IsNewProject)
                {
                    bool needAzureKeyAuth = rootNamespace.Auth?.ApiKey != null;
                    // TODO - add support for DataFactoryElement lookup
                    await new NewProjectScaffolding(needAzureKeyAuth).Execute();
                }
            }
            else if (File.Exists(codeModelInputPath))
            {
                var yaml = await File.ReadAllTextAsync(codeModelInputPath);
                var codeModel = CodeModelSerialization.DeserializeCodeModel(yaml);
                workspace = await new CSharpGen().ExecuteAsync(codeModel);
                if (options.IsNewProject)
                {
                    bool needAzureKeyAuth = codeModel.Security.Schemes.Any(scheme => scheme is KeySecurityScheme);
                    bool includeDfe = yaml.Contains("x-ms-format: dfe-", StringComparison.Ordinal);
                    //await new NewProjectScaffolding(needAzureKeyAuth).Execute();
                    new CSharpProj(needAzureKeyAuth, includeDfe).Execute();
                }
            }
            else
            {
                throw new InvalidOperationException($"Neither CodeModel.yaml nor tspCodeModel.json exist in {outputPath} folder.");
            }

            if (options.ClearOutputFolder)
            {
                DeleteDirectory(outputPath, keepFiles);
                DeleteDirectory(generatedTestOutputPath, keepFiles);
            }

            await foreach (var file in workspace.GetGeneratedFilesAsync())
            {
                if (string.IsNullOrEmpty(file.Text))
                {
                    continue;
                }
                var filename = Path.Combine(outputPath, file.Name);
                Console.WriteLine($"Writing {filename}");
                Directory.CreateDirectory(Path.GetDirectoryName(filename)!);
                await File.WriteAllTextAsync(filename, file.Text);
            }
        }

        private static void DeleteDirectory(string path, string[] keepFiles)
        {
            var directoryInfo = new DirectoryInfo(path);
            if (!directoryInfo.Exists)
            {
                return;
            }
            foreach (FileInfo file in directoryInfo.GetFiles())
            {
                if (keepFiles.Contains(file.Name))
                {
                    continue;
                }
                file.Delete();
            }

            foreach (DirectoryInfo directory in directoryInfo.GetDirectories())
            {
                DeleteDirectory(directory.FullName, keepFiles);
            }

            if (!directoryInfo.EnumerateFileSystemInfos().Any())
            {
                directoryInfo.Delete();
            }
        }

        internal static void LoadConfiguration(string? projectPath, string outputPath, string? existingProjectFolder, string json)
        {
            var root = JsonDocument.Parse(json).RootElement;
            Configuration.LoadConfiguration(root, projectPath, outputPath, existingProjectFolder);
        }
    }
}
