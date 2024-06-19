// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    internal sealed class CSharpGen
    {
        private const string ConfigurationFileName = "Configuration.json";
        private const string CodeModelFileName = "tspCodeModel.json";
        private const string GeneratedFolderName = "Generated";

        private static readonly string[] _filesToKeep = [ConfigurationFileName, CodeModelFileName];

        /// <summary>
        /// Executes the generator task with the <see cref="CodeModelPlugin"/> instance.
        /// </summary>
        public async Task ExecuteAsync()
        {
            GeneratedCodeWorkspace.Initialize();
            var outputPath = CodeModelPlugin.Instance.Configuration.OutputDirectory;
            var generatedSourceOutputPath = ParseGeneratedSourceOutputPath(outputPath);
            var generatedTestOutputPath = Path.Combine(outputPath, "..", "..", "tests", GeneratedFolderName);

            GeneratedCodeWorkspace workspace = await GeneratedCodeWorkspace.Create();

            var output = CodeModelPlugin.Instance.OutputLibrary;
            Directory.CreateDirectory(Path.Combine(generatedSourceOutputPath, "Models"));
            List<Task> generateFilesTasks = new();

            foreach (TypeProvider model in output.Models) // now is of type TypeProvider and not ModelProvider so this doesn't compile
            {
                generateFilesTasks.Add(workspace.AddGeneratedFile(CodeModelPlugin.Instance.GetWriter(model).Write()));

                foreach (var serialization in model.SerializationProviders)
                {
                    generateFilesTasks.Add(workspace.AddGeneratedFile(CodeModelPlugin.Instance.GetWriter(serialization).Write()));
                }
            }

            foreach (TypeProvider enumType in output.Enums)
            {
                generateFilesTasks.Add(workspace.AddGeneratedFile(CodeModelPlugin.Instance.GetWriter(enumType).Write()));

                foreach (var serialization in enumType.SerializationProviders)
                {
                    generateFilesTasks.Add(workspace.AddGeneratedFile(CodeModelPlugin.Instance.GetWriter(serialization).Write()));
                }
            }

            foreach (var client in output.Clients)
            {
                generateFilesTasks.Add(workspace.AddGeneratedFile(CodeModelPlugin.Instance.GetWriter(client).Write()));
            }

            Directory.CreateDirectory(Path.Combine(generatedSourceOutputPath, "Internal"));
            foreach (var type in output.Types)
            {
                generateFilesTasks.Add(workspace.AddGeneratedFile(CodeModelPlugin.Instance.GetWriter(type).Write()));
            }

            // Add all the generated files to the workspace
            await Task.WhenAll(generateFilesTasks);

            if (CodeModelPlugin.Instance.Configuration.ClearOutputFolder)
            {
                DeleteDirectory(generatedSourceOutputPath, _filesToKeep);
                DeleteDirectory(generatedTestOutputPath, _filesToKeep);
            }

            // Write the generated files to the output directory
            await foreach (var file in workspace.GetGeneratedFilesAsync())
            {
                if (string.IsNullOrEmpty(file.Text))
                {
                    continue;
                }
                var filename = Path.Combine(outputPath, file.Name);
                Console.WriteLine($"Writing {Path.GetFullPath(filename)}");
                Directory.CreateDirectory(Path.GetDirectoryName(filename)!);
                await File.WriteAllTextAsync(filename, file.Text);
            }
        }

        /// <summary>
        /// Parses and updates the output path for the generated code.
        /// </summary>
        /// <param name="outputPath">The output path.</param>
        /// <returns>The parsed output path string.</returns>
        internal static string ParseGeneratedSourceOutputPath(string outputPath)
        {
            if (!outputPath.EndsWith("src", StringComparison.Ordinal) && !outputPath.EndsWith("src/", StringComparison.Ordinal))
            {
                outputPath = Path.Combine(outputPath, "src");
            }

            outputPath = Path.Combine(outputPath, GeneratedFolderName);

            return outputPath;
        }

        /// <summary>
        /// Clears the output directory specified by <paramref name="path"/>. If <paramref name="filesToKeep"/> is not null,
        /// the specified files in the output directory will not be deleted.
        /// </summary>
        /// <param name="path">The path of the directory to delete.</param>
        /// <param name="filesToKeep">The list of file names to retain.</param>
        private static void DeleteDirectory(string path, string[] filesToKeep)
        {
            var directoryInfo = new DirectoryInfo(path);
            if (!directoryInfo.Exists)
            {
                return;
            }

            foreach (var file in directoryInfo.GetFiles("*", SearchOption.AllDirectories))
            {
                if (!filesToKeep.Contains(file.Name))
                {
                    file.Delete();
                }
            }

            foreach (var directory in directoryInfo.GetDirectories("*", SearchOption.AllDirectories))
            {
                if (!Directory.Exists(directory.FullName))
                {
                    continue;
                }

                if (!directory.EnumerateFiles("*", SearchOption.AllDirectories).Any())
                {
                    directory.Delete(true);
                }
            }

            if (!directoryInfo.EnumerateFileSystemInfos().Any())
            {
                directoryInfo.Delete();
            }
        }
    }
}
