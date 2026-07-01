// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class CSharpGen
    {
        private const string ConfigurationFileName = "Configuration.json";
        private const string CodeModelFileName = "tspCodeModel.json";
        private const string RawRequestUriBuilderExtensionsFileName = "RawRequestUriBuilderExtensions.cs";
        private const string SerializationFormatFileName = "SerializationFormat.cs";
        private const string TypeFormattersFileName = "TypeFormatters.cs";

        private static readonly string[] _filesToKeep =
        [
            ConfigurationFileName,
            CodeModelFileName,
            RawRequestUriBuilderExtensionsFileName,
            SerializationFormatFileName,
            TypeFormattersFileName
        ];

        internal static GeneratedCodeWorkspacePostProcessingProfile? GenerationProfile { get; set; }

        /// <summary>
        /// Executes the generator task with the <see cref="CodeModelGenerator"/> instance.
        /// </summary>
        public async Task ExecuteAsync()
        {
            CodeModelGenerator.Instance.Emitter.Info("Starting code generation");
            CodeModelGenerator.Instance.Stopwatch.Start();
            ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();

            var outputPath = CodeModelGenerator.Instance.Configuration.OutputDirectory;
            var generatedSourceOutputPath = CodeModelGenerator.Instance.Configuration.ProjectGeneratedDirectory;

            // Resolve PackageReference items from the .csproj so custom code referencing
            // external NuGet types (e.g., Azure.Storage.Common) compiles correctly.
            await MeasureGenerationStepAsync("Generation.AddPackageReferencesFromProject", GeneratedCodeWorkspace.AddPackageReferencesFromProject);

            // Pre-walk the input library and resolve any external types that point at NuGet packages.
            // This populates ExternalTypeReferenceResolver's cache and registers each resolved assembly
            // as an additional metadata reference *before* the generated/custom code workspaces are
            // constructed, so their cached Roslyn projects pick the references up.
            await MeasureGenerationStepAsync("Generation.ResolveExternalTypeReferences", ExternalTypeReferenceResolver.ResolveAllAsync);

            // Initialize the workspace project AFTER all metadata references have been added so the
            // eagerly-cached project sees them.
            GeneratedCodeWorkspace.Initialize();

            GeneratedCodeWorkspace customCodeWorkspace = await MeasureGenerationStepAsync(
                "Generation.CreateCustomCodeWorkspace",
                () => GeneratedCodeWorkspace.Create(isCustomCodeProject: true));
            // The generated attributes need to be added into the workspace before loading the custom code. Otherwise,
            // Roslyn doesn't load the attributes completely and we are unable to get the attribute arguments.

            List<Task> generateAttributeTasks = new();
            foreach (var attributeProvider in CodeModelGenerator.Instance.CustomCodeAttributeProviders)
            {
                generateAttributeTasks.Add(customCodeWorkspace.AddInMemoryFile(attributeProvider));
            }

            await MeasureGenerationStepAsync("Generation.AddCustomizationAttributeProviders", () => Task.WhenAll(generateAttributeTasks));

            CodeModelGenerator.Instance.SourceInputModel = await MeasureGenerationStepAsync(
                "Generation.CreateSourceInputModel",
                async () => new SourceInputModel(
                    await customCodeWorkspace.GetCompilationAsync(),
                    await GeneratedCodeWorkspace.LoadBaselineContract(),
                    GeneratedCodeWorkspace.LoadApiCompatBaseline()));

            GeneratedCodeWorkspace generatedCodeWorkspace = await MeasureGenerationStepAsync(
                "Generation.CreateGeneratedCodeWorkspace",
                () => GeneratedCodeWorkspace.Create(isCustomCodeProject: false));

            var output = MeasureGenerationStep("Generation.GetOutputLibrary", () => CodeModelGenerator.Instance.OutputLibrary);
            Directory.CreateDirectory(Path.Combine(generatedSourceOutputPath, "Models"));
            List<Task> generateFilesTasks = new();

            // Build all TypeProviders
            MeasureGenerationStep("Generation.BuildTypeProviders", () =>
            {
                foreach (var type in output.TypeProviders)
                {
                    type.EnsureBuilt();
                }
            });

            LoggingHelpers.LogElapsedTime("All generated type providers built");

            // visit the entire library before generating files
            MeasureGenerationStep("Generation.ApplyVisitors", () =>
            {
                foreach (var visitor in CodeModelGenerator.Instance.Visitors)
                {
                    visitor.VisitLibrary(output);
                }
            });

            MeasureGenerationStep("Generation.FilterCustomizedMembers", () => FilterAllCustomizedMembers(output));

            LoggingHelpers.LogElapsedTime("All visitors have been applied");

            MeasureGenerationStep("Generation.ProcessTypeBackCompatibility", () =>
            {
                foreach (var outputType in output.TypeProviders)
                {
                    // Ensure back-compatibility processing is done after all visitors have run
                    outputType.ProcessTypeForBackCompatibility();
                }
            });

            if (ProviderReferenceMapShadowAnalyzer.UseShadowMap)
            {
                MeasureGenerationStep("Generation.ApplyPreWriteAccessibility", () => generatedCodeWorkspace.ApplyPreWriteAccessibility(output.TypeProviders));
            }

            MeasureGenerationStep("Generation.WriteTypeProviders", () =>
            {
                foreach (var outputType in output.TypeProviders)
                {
                    if (outputType is ModelFactoryProvider && outputType.Methods.Count == 0)
                    {
                        continue;
                    }

                    var writer = CodeModelGenerator.Instance.GetWriter(outputType);
                    generateFilesTasks.Add(generatedCodeWorkspace.AddGeneratedFile(writer.Write()));

                    foreach (var serialization in outputType.SerializationProviders)
                    {
                        writer = CodeModelGenerator.Instance.GetWriter(serialization);
                        generateFilesTasks.Add(generatedCodeWorkspace.AddGeneratedFile(writer.Write()));
                    }
                }
            });

            // Add all the generated files to the workspace
            await MeasureGenerationStepAsync("Generation.AddGeneratedFilesToWorkspace", () => Task.WhenAll(generateFilesTasks));

            if (ProviderReferenceMapShadowAnalyzer.UseShadowMap)
            {
                MeasureGenerationStep("Generation.ProviderReferenceMapAnalysis", () => generatedCodeWorkspace.AnalyzeProviderReferenceMap(output.TypeProviders));
                ProviderReferenceMapAnalyzer.RestorePreWriteModelFactoryMethods();
            }

            LoggingHelpers.LogElapsedTime("All generated types have been written into memory");

            // Delete any old generated files
            MeasureGenerationStep("Generation.DeleteOldGeneratedFiles", () => DeleteDirectory(generatedSourceOutputPath, GetFilesToKeep()));

            LoggingHelpers.LogElapsedTime("All old generated files have been deleted");

            await MeasureGenerationStepAsync("Generation.PostProcessAsync", generatedCodeWorkspace.PostProcessAsync);
            ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();

            // Write the generated files to the output directory
            await MeasureGenerationStepAsync("Generation.WriteGeneratedFilesToDisk", async () =>
            {
                var generatedFiles = new List<(string Name, string Text)>();
                await foreach (var file in generatedCodeWorkspace.GetGeneratedFilesAsync())
                {
                    if (string.IsNullOrEmpty(file.Text))
                    {
                        continue;
                    }

                    generatedFiles.Add((file.Name, file.Text));
                }

                foreach (var file in generatedFiles)
                {
                    var filename = Path.Combine(outputPath, file.Name);
                    CodeModelGenerator.Instance.Emitter.Info($"Writing {Path.GetFullPath(filename)}");
                    Directory.CreateDirectory(Path.GetDirectoryName(filename)!);
                    await File.WriteAllTextAsync(filename, file.Text);
                }
            });

            // Write additional output files (e.g. configuration schemas, .targets files)
            await MeasureGenerationStepAsync("Generation.WriteAdditionalFiles", () => CodeModelGenerator.Instance.WriteAdditionalFiles(outputPath));

            // Write project scaffolding files (after additional files so schema existence can be checked)
            if (CodeModelGenerator.Instance.IsNewProject)
            {
                await MeasureGenerationStepAsync(
                    "Generation.WriteProjectScaffolding",
                    () => CodeModelGenerator.Instance.TypeFactory.CreateNewProjectScaffolding().Execute());
            }

            LoggingHelpers.LogElapsedTime("All files have been written to disk");
        }

        private static void MeasureGenerationStep(string stepName, Action action)
        {
            MeasureGenerationStep(
                stepName,
                () =>
                {
                    action();
                    return 0;
                });
        }

        private static T MeasureGenerationStep<T>(string stepName, Func<T> action)
        {
            var profile = GenerationProfile;
            if (profile == null)
            {
                return action();
            }

            var allocatedBytes = GC.GetTotalAllocatedBytes(precise: false);
            var stopwatch = Stopwatch.StartNew();
            try
            {
                return action();
            }
            finally
            {
                stopwatch.Stop();
                profile.Add(stepName, stopwatch.Elapsed, GC.GetTotalAllocatedBytes(precise: false) - allocatedBytes);
            }
        }

        private static Task MeasureGenerationStepAsync(string stepName, Func<Task> action) => MeasureGenerationStepAsync(
            stepName,
            async () =>
            {
                await action();
                return 0;
            });

        private static async Task<T> MeasureGenerationStepAsync<T>(string stepName, Func<Task<T>> action)
        {
            var profile = GenerationProfile;
            if (profile == null)
            {
                return await action();
            }

            var allocatedBytes = GC.GetTotalAllocatedBytes(precise: false);
            var stopwatch = Stopwatch.StartNew();
            try
            {
                return await action();
            }
            finally
            {
                stopwatch.Stop();
                profile.Add(stepName, stopwatch.Elapsed, GC.GetTotalAllocatedBytes(precise: false) - allocatedBytes);
            }
        }

        internal static void FilterAllCustomizedMembers(OutputLibrary output)
        {
            foreach (var typeProvider in output.TypeProviders)
            {
                // Update the type with the potentially modified members, filtering out customized members
                // after the visitors have been applied so that the filtering is done against the final version.
                FilterCustomizedMembers(typeProvider);
                foreach (var serializationProvider in typeProvider.SerializationProviders)
                {
                    FilterCustomizedMembers(serializationProvider);
                }
            }
        }

        private static void FilterCustomizedMembers(TypeProvider typeProvider)
        {
            // Update applies customization filtering internally, so passing the current cached members
            // is sufficient to apply the filter (e.g., after EnsureBuilt populated unfiltered caches).
            typeProvider.Update(
                typeProvider.Methods,
                typeProvider.Constructors,
                typeProvider.Properties,
                typeProvider.Fields);
        }

        private static string[] GetFilesToKeep()
        {
            return _filesToKeep
                .Concat(
                    CodeModelGenerator.Instance.AdditionalRootTypes
                        .Concat(CodeModelGenerator.Instance.NonRootTypes)
                        .Select(GetFileNameForType))
                .Distinct(StringComparer.Ordinal)
                .ToArray();
        }

        private static string GetFileNameForType(string typeName)
        {
            var simpleNameStart = typeName.LastIndexOf('.') + 1;
            var simpleName = simpleNameStart > 0 ? typeName[simpleNameStart..] : typeName;
            var genericArityStart = simpleName.IndexOf('`');
            if (genericArityStart >= 0)
            {
                simpleName = simpleName[..genericArityStart];
            }

            return simpleName.EndsWith(".cs", StringComparison.Ordinal) ? simpleName : $"{simpleName}.cs";
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
