// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Utilities;

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
        public Task ExecuteAsync() => ExecuteCoreAsync(null);

        // A false residual-input result requires the trusted caller to discard
        // the isolated output. A true result is not a complete host certificate:
        // publication, all consumers and compilation still require validation.
        // Generation mutates the generator instance; fallback must use a fresh
        // instance rather than reuse this one, including after an exception.
        internal async Task<CompilerBuildGenerationResult> ExecuteForCompilerBuildAsync(string isolatedOutputDirectory,
            CompilerBuildInputProof.ITrustedCompilerBuildSession session)
        {
            var generator = CodeModelGenerator.Instance;
            var previousContext = generator.CompilerBuildContext;
            var generation = new CompilerBuildGenerationContext(isolatedOutputDirectory, session);
            generator.CompilerBuildContext = generation;
            try
            {
                var projectFile = Path.GetFullPath(Path.Combine(generator.Configuration.ProjectDirectory,
                    $"{generator.Configuration.PackageName}.csproj"));
                if (File.Exists(projectFile))
                {
                    generation.BootstrapAssets = CompilerBuildInputProof.TryCaptureBootstrapAssets(session, generator.Configuration.OutputDirectory, projectFile)
                        ?? throw new InvalidOperationException("Compiler-host generation requires current captured project assets for this project.");
                }
                await ExecuteCoreAsync(generation);
                return new CompilerBuildGenerationResult(generation.UsedCapturedResidualInputs);
            }
            finally
            {
                generator.CompilerBuildContext = previousContext;
            }
        }

        internal sealed record CompilerBuildGenerationResult(bool UsedCapturedResidualInputs);

        private async Task ExecuteCoreAsync(CompilerBuildGenerationContext? compilerBuild)
        {
            var generator = CodeModelGenerator.Instance;
            if (compilerBuild is not null && (generator.IsHosted || generator.IsNewProject))
            {
                throw new InvalidOperationException("Compiler-host generation does not support hosted or new-project mode.");
            }
            var originalOutputPath = generator.Configuration.OutputDirectory;
            var outputPath = compilerBuild is null ? originalOutputPath : PrepareIsolatedOutput(compilerBuild.OutputDirectory, originalOutputPath);
            var generatedSourceOutputPath = compilerBuild is null
                ? generator.Configuration.ProjectGeneratedDirectory
                : Path.Combine(outputPath, "src", "Generated");
            if (compilerBuild is not null && PreparedFieldTypes.IsPolicyEnabled(generator))
            {
                compilerBuild.SourceProof = CompilerBuildInputProof.TryCreate(compilerBuild.Session, originalOutputPath);
            }
            var compilerProof = compilerBuild?.SourceProof;

            generator.Emitter.Info("Starting code generation");
            generator.Stopwatch.Start();

            // Resolve PackageReference items from the .csproj so custom code referencing external
            // NuGet types compiles correctly.
            await GeneratedCodeWorkspace.AddPackageReferencesFromProject();

            // Pre-walk the input library and resolve any external types that point at NuGet packages.
            // This populates ExternalTypeReferenceResolver's cache and registers each resolved assembly
            // as an additional metadata reference *before* the generated/custom code workspaces are
            // constructed, so their cached Roslyn projects pick the references up.
            await ExternalTypeReferenceResolver.ResolveAllAsync();

            // Initialize the workspace project AFTER all metadata references have been added so the
            // eagerly-cached project sees them.
            GeneratedCodeWorkspace.Initialize();

            GeneratedCodeWorkspace customCodeWorkspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: true);
            // The generated attributes need to be added into the workspace before loading the custom code. Otherwise,
            // Roslyn doesn't load the attributes completely and we are unable to get the attribute arguments.

            List<Task> generateAttributeTasks = new();
            foreach (var attributeProvider in CodeModelGenerator.Instance.CustomCodeAttributeProviders)
            {
                generateAttributeTasks.Add(customCodeWorkspace.AddInMemoryFile(attributeProvider));
            }

            await Task.WhenAll(generateAttributeTasks);

            var sourceInputModel = new SourceInputModel(
                await customCodeWorkspace.GetCompilationAsync(),
                await GeneratedCodeWorkspace.LoadBaselineContract(),
                GeneratedCodeWorkspace.LoadApiCompatBaseline());
            if (compilerBuild is not null)
            {
                sourceInputModel.PreEmissionSourceInputs = compilerProof;
            }
            CodeModelGenerator.Instance.SourceInputModel = sourceInputModel;

            GeneratedCodeWorkspace generatedCodeWorkspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);

            var output = CodeModelGenerator.Instance.OutputLibrary;
            Directory.CreateDirectory(Path.Combine(generatedSourceOutputPath, "Models"));
            List<Task> generateFilesTasks = new();

            // Build all TypeProviders
            foreach (var type in output.TypeProviders)
            {
                type.EnsureBuilt();
            }

            LoggingHelpers.LogElapsedTime("All generated type providers built");

            // visit the entire library before generating files
            foreach (var visitor in CodeModelGenerator.Instance.Visitors)
            {
                visitor.VisitLibrary(output);
            }

            FilterAllCustomizedMembers(output);

            LoggingHelpers.LogElapsedTime("All visitors have been applied");

            foreach (var outputType in output.TypeProviders)
            {
                // Ensure back-compatibility processing is done after all visitors have run
                outputType.ProcessTypeForBackCompatibility();
            }

            try
            {
                using var referenceMapSession = ProviderReferenceMapAnalyzer.PrepareForGeneration(output.TypeProviders);
                using var preparedFields = PreparedFieldTypes.CreateForGeneration(
                    CodeModelGenerator.Instance, output.TypeProviders, referenceMapSession.ShouldWriteProvider);

                // Keep the existing streaming path when preparation is disabled.
                // With prepared spellings, stage every file until the complete
                // provider snapshot has survived all writer callbacks.
                List<CodeFile>? stagedFiles = preparedFields is null && (compilerBuild is null || compilerProof is null)
                    ? null : new List<CodeFile>();

                void WriteFiles(PreparedFieldTypes? fields)
                {
                    void AddFile(TypeProvider provider)
                    {
                        fields?.ObserveSnapshot();
                        var writer = CodeModelGenerator.Instance.GetWriter(provider);
                        writer.PreparedFieldTypes = fields;
                        var file = writer.Write();
                        fields?.ObserveSnapshot();
                        if (stagedFiles is null)
                        {
                            generateFilesTasks.Add(generatedCodeWorkspace.AddGeneratedFile(file));
                        }
                        else
                        {
                            stagedFiles.Add(file);
                        }
                    }

                    foreach (var provider in GetWrittenProviders(output, referenceMapSession))
                    {
                        AddFile(provider);
                    }
                }

                WriteFiles(preparedFields);
                if (stagedFiles is not null)
                {
                    // A writer callback may register a rewriter after preparation
                    // started. Recheck after the proof itself, then use the already
                    // captured qualified variants if the opt-out became active.
                    var canCommit = preparedFields is not null && preparedFields.CanCommit() && PreparedFieldTypes.IsPolicyEnabled(generator);
                    if (compilerBuild is not null)
                    {
                        var useCapturedResidual = compilerProof is not null && PreparedFieldTypes.IsPolicyEnabled(generator) &&
                            compilerProof.IsCurrentFor(originalOutputPath);
                        if (useCapturedResidual)
                        {
                            generatedCodeWorkspace = await GeneratedCodeWorkspace.CreateForCompilerProof(compilerProof!);
                            compilerBuild.UsedCapturedResidualInputs = true;
                        }
                        canCommit &= useCapturedResidual;
                    }
                    foreach (var file in stagedFiles)
                    {
                        // Both variants were emitted during the same writer pass;
                        // never rerun callbacks if the prepared proof changed.
                        generateFilesTasks.Add(generatedCodeWorkspace.AddGeneratedFile(
                            canCommit ? file : file.WithoutPreparedNames()));
                    }
                }

                // Add all the generated files to the workspace
                await Task.WhenAll(generateFilesTasks);

                referenceMapSession.RestorePreWriteModelFactoryMethods();

                LoggingHelpers.LogElapsedTime("All generated types have been written into memory");

                // Delete any old generated files
                DeleteDirectory(generatedSourceOutputPath, _filesToKeep);

                LoggingHelpers.LogElapsedTime("All old generated files have been deleted");
            }
            finally
            {
                ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
            }

            var generatedFiles = new List<(string Name, string Text)>();
            await foreach (var file in generatedCodeWorkspace.GetGeneratedFilesAsync())
            {
                if (string.IsNullOrEmpty(file.Text))
                {
                    continue;
                }

                generatedFiles.Add((file.Name, file.Text));
            }

            // Write the generated files to the output directory
            foreach (var file in generatedFiles)
            {
                var filename = compilerBuild is null ? Path.Combine(outputPath, file.Name) : ResolveIsolatedFile(outputPath, file.Name);
                CodeModelGenerator.Instance.Emitter.Info($"Writing {Path.GetFullPath(filename)}");
                Directory.CreateDirectory(Path.GetDirectoryName(filename)!);
                await File.WriteAllTextAsync(filename, file.Text);
            }

            // A compiler-host session emits only provider files into its private
            // output. Its trusted caller must reject generators that require
            // additional C# files; normal generation retains all extra outputs.
            if (compilerBuild is null)
            {
                await CodeModelGenerator.Instance.WriteAdditionalFiles(outputPath);
            }

            // Write project scaffolding files (after additional files so schema existence can be checked)
            if (CodeModelGenerator.Instance.IsNewProject)
            {
                await CodeModelGenerator.Instance.TypeFactory.CreateNewProjectScaffolding().Execute();
            }

            LoggingHelpers.LogElapsedTime("All files have been written to disk");

            if (compilerBuild?.UsedCapturedResidualInputs == true &&
                (!PreparedFieldTypes.IsPolicyEnabled(generator) || compilerProof is null || !compilerProof.IsCurrentFor(originalOutputPath) ||
                    generator.CompilerBuildAssets is not null && !generator.CompilerBuildAssets.IsCurrent()))
            {
                compilerBuild.UsedCapturedResidualInputs = false;
            }
        }

        private static string PrepareIsolatedOutput(string isolatedOutputDirectory, string originalOutputDirectory)
        {
            if (!Path.IsPathFullyQualified(isolatedOutputDirectory))
            {
                throw new InvalidOperationException("Compiler-host output must be an absolute path.");
            }
            var isolated = Path.GetFullPath(isolatedOutputDirectory);
            var original = Path.GetFullPath(originalOutputDirectory);
            var projectDirectory = Path.Combine(original, "src");
            if (IsWithin(original, isolated) || IsWithin(isolated, projectDirectory) || PreparedFieldTypes.HasUnstablePath(isolated) ||
                Directory.Exists(isolated) && Directory.EnumerateFileSystemEntries(isolated).Any())
            {
                throw new InvalidOperationException("Compiler-host output must be a fresh, isolated directory outside the source tree.");
            }
            Directory.CreateDirectory(isolated);
            return isolated;
        }

        private static string ResolveIsolatedFile(string isolatedOutputDirectory, string relativePath)
        {
            if (Path.IsPathFullyQualified(relativePath))
            {
                throw new InvalidOperationException("Compiler-host output paths must be relative.");
            }
            var path = Path.GetFullPath(relativePath, isolatedOutputDirectory);
            if (!IsWithin(path, isolatedOutputDirectory) || PreparedFieldTypes.HasUnstablePath(path))
            {
                throw new InvalidOperationException("Compiler-host output escaped its isolated directory.");
            }
            return path;
        }

        private static bool IsWithin(string path, string directory)
        {
            var comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
            var root = Path.TrimEndingDirectorySeparator(Path.GetFullPath(directory));
            var candidate = Path.GetFullPath(path);
            return candidate.Equals(root, comparison) || candidate.StartsWith(root + Path.DirectorySeparatorChar, comparison);
        }

        private static IEnumerable<TypeProvider> GetWrittenProviders(OutputLibrary output, ProviderReferenceMapSession referenceMapSession)
        {
            foreach (var outputType in output.TypeProviders)
            {
                if (!referenceMapSession.ShouldWriteProvider(outputType) ||
                    outputType is ModelFactoryProvider && outputType.Methods.Count == 0)
                {
                    continue;
                }
                yield return outputType;
                foreach (var serialization in outputType.SerializationProviders)
                {
                    if (referenceMapSession.ShouldWriteProvider(serialization))
                    {
                        yield return serialization;
                    }
                }
            }
        }

        internal static void FilterAllCustomizedMembers(OutputLibrary output)
        {
            var visited = new HashSet<TypeProvider>();
            foreach (var typeProvider in output.TypeProviders)
            {
                FilterAllCustomizedMembers(typeProvider, visited);
            }
        }

        private static void FilterAllCustomizedMembers(TypeProvider typeProvider, HashSet<TypeProvider> visited)
        {
            if (!visited.Add(typeProvider))
            {
                return;
            }

            // Update the type with the potentially modified members, filtering out customized members
            // after the visitors have been applied so that the filtering is done against the final version.
            FilterCustomizedMembers(typeProvider);
            foreach (var serializationProvider in typeProvider.SerializationProviders)
            {
                FilterAllCustomizedMembers(serializationProvider, visited);
            }
            foreach (var nestedType in typeProvider.NestedTypes)
            {
                FilterAllCustomizedMembers(nestedType, visited);
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

            var fileNamesToKeep = filesToKeep.ToHashSet(StringComparer.Ordinal);
            foreach (var file in directoryInfo.GetFiles("*", SearchOption.AllDirectories))
            {
                if (!fileNamesToKeep.Contains(file.Name))
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
