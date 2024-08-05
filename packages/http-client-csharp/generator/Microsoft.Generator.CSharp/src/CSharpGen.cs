// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Primitives;

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

            // visit the entire library before generating files
            foreach (var visitor in CodeModelPlugin.Instance.Visitors)
            {
                visitor.Visit(output);
            }

            foreach (var outputType in output.TypeProviders)
            {
                var writer = CodeModelPlugin.Instance.GetWriter(outputType);
                generateFilesTasks.Add(workspace.AddGeneratedFile(writer.Write()));

                foreach (var serialization in outputType.SerializationProviders)
                {
                    writer = CodeModelPlugin.Instance.GetWriter(serialization);
                    generateFilesTasks.Add(workspace.AddGeneratedFile(writer.Write()));
                }
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

            // Write project scaffolding files
            if (CodeModelPlugin.Instance.IsNewProject)
            {
                var scaffolding = new NewProjectScaffolding();
                await scaffolding.Execute();
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
