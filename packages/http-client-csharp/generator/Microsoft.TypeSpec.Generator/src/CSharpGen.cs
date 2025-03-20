// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.SourceInput;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class CSharpGen
    {
        private const string ConfigurationFileName = "Configuration.json";
        private const string CodeModelFileName = "tspCodeModel.json";

        private static readonly string[] _filesToKeep = [ConfigurationFileName, CodeModelFileName];

        /// <summary>
        /// Executes the generator task with the <see cref="CodeModelGenerator"/> instance.
        /// </summary>
        public async Task ExecuteAsync()
        {
            GeneratedCodeWorkspace.Initialize();
            var outputPath = CodeModelGenerator.Instance.Configuration.OutputDirectory;
            var generatedSourceOutputPath = CodeModelGenerator.Instance.Configuration.ProjectGeneratedDirectory;
            var generatedTestOutputPath = CodeModelGenerator.Instance.Configuration.TestGeneratedDirectory;

            GeneratedCodeWorkspace customCodeWorkspace = await GeneratedCodeWorkspace.Create();

            // The generated attributes need to be added into the workspace before loading the custom code. Otherwise,
            // Roslyn doesn't load the attributes completely and we are unable to get the attribute arguments.

            List<Task> generateAttributeTasks = new();
            foreach (var attributeProvider in CodeModelGenerator.Instance.CustomCodeAttributeProviders)
            {
                generateAttributeTasks.Add(customCodeWorkspace.AddInMemoryFile(attributeProvider));
            }

            await Task.WhenAll(generateAttributeTasks);

            CodeModelGenerator.Instance.SourceInputModel = new SourceInputModel(await customCodeWorkspace.GetCompilationAsync());

            GeneratedCodeWorkspace generatedCodeWorkspace = await GeneratedCodeWorkspace.Create();

            var output = CodeModelGenerator.Instance.OutputLibrary;
            Directory.CreateDirectory(Path.Combine(generatedSourceOutputPath, "Models"));
            List<Task> generateFilesTasks = new();

            // visit the entire library before generating files
            foreach (var visitor in CodeModelGenerator.Instance.Visitors)
            {
                visitor.Visit(output);
            }

            foreach (var outputType in output.TypeProviders)
            {
                var writer = CodeModelGenerator.Instance.GetWriter(outputType);
                generateFilesTasks.Add(generatedCodeWorkspace.AddGeneratedFile(writer.Write()));

                foreach (var serialization in outputType.SerializationProviders)
                {
                    writer = CodeModelGenerator.Instance.GetWriter(serialization);
                    generateFilesTasks.Add(generatedCodeWorkspace.AddGeneratedFile(writer.Write()));
                }
            }

            // Add all the generated files to the workspace
            await Task.WhenAll(generateFilesTasks);

            if (CodeModelGenerator.Instance.Configuration.ClearOutputFolder)
            {
                DeleteDirectory(generatedSourceOutputPath, _filesToKeep);
                DeleteDirectory(generatedTestOutputPath, _filesToKeep);
            }

            await generatedCodeWorkspace.PostProcessAsync();

            // Write the generated files to the output directory
            await foreach (var file in generatedCodeWorkspace.GetGeneratedFilesAsync())
            {
                if (string.IsNullOrEmpty(file.Text))
                {
                    continue;
                }
                var filename = Path.Combine(outputPath, file.Name);
                CodeModelGenerator.Instance.Emitter.Info($"Writing {Path.GetFullPath(filename)}");
                Directory.CreateDirectory(Path.GetDirectoryName(filename)!);
                await File.WriteAllTextAsync(filename, file.Text);
            }

            // Write project scaffolding files
            if (CodeModelGenerator.Instance.IsNewProject)
            {
                await CodeModelGenerator.Instance.TypeFactory.CreateNewProjectScaffolding().Execute();
            }
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
