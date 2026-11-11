// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    // Invocation-local adaptation of retained compiler inputs and isolated output.
    // This context is not a build-host certificate and cannot authorize publication
    // or consuming compilation.
    internal sealed class CompilerBuildGenerationContext(
        string outputDirectory, CompilerBuildInputProof.ITrustedCompilerBuildSession session)
    {
        private string? _originalOutputDirectory;

        internal string OutputDirectory { get; private set; } = outputDirectory;
        internal string GeneratedSourceDirectory => Path.Combine(OutputDirectory, "src", "Generated");
        internal CompilerBuildInputProof.BootstrapAssets? BootstrapAssets { get; set; }
        internal CompleteSourceInputSnapshot? SourceProof { get; private set; }
        internal bool UsedCapturedResidualInputs { get; set; }

        internal void Initialize(CodeModelGenerator generator)
        {
            _originalOutputDirectory = generator.Configuration.OutputDirectory;
            var projectFile = Path.GetFullPath(Path.Combine(generator.Configuration.ProjectDirectory,
                $"{generator.Configuration.PackageName}.csproj"));
            if (File.Exists(projectFile))
            {
                BootstrapAssets = CompilerBuildInputProof.TryCaptureBootstrapAssets(session, _originalOutputDirectory, projectFile)
                    ?? throw new InvalidOperationException("Compiler-host generation requires current captured project assets for this project.");
            }
            if (generator.IsHosted || generator.IsNewProject)
            {
                throw new InvalidOperationException("Compiler-host generation does not support hosted or new-project mode.");
            }
            OutputDirectory = PrepareIsolatedOutput(OutputDirectory, _originalOutputDirectory);
            if (PreparedFieldTypes.IsPolicyEnabled(generator))
            {
                SourceProof = CompilerBuildInputProof.TryCreate(session, _originalOutputDirectory);
            }
        }

        internal void ApplySourceProof(SourceInputModel model) => model.PreEmissionSourceInputs = SourceProof;

        internal async Task<GeneratedCodeWorkspace?> TryCreateResidualWorkspaceAsync(CodeModelGenerator generator)
        {
            if (SourceProof is null || !PreparedFieldTypes.IsPolicyEnabled(generator) ||
                !SourceProof.IsCurrentFor(_originalOutputDirectory!))
            {
                return null;
            }
            var workspace = await GeneratedCodeWorkspace.CreateForCompilerProof(SourceProof);
            UsedCapturedResidualInputs = true;
            return workspace;
        }

        internal void ValidateResult(CodeModelGenerator generator)
        {
            if (UsedCapturedResidualInputs &&
                (!PreparedFieldTypes.IsPolicyEnabled(generator) || SourceProof is null || !SourceProof.IsCurrentFor(_originalOutputDirectory!) ||
                    generator.CompilerBuildAssets is not null && !generator.CompilerBuildAssets.IsCurrent()))
            {
                UsedCapturedResidualInputs = false;
            }
        }

        internal string ResolveOutputFile(string relativePath)
        {
            if (Path.IsPathFullyQualified(relativePath))
            {
                throw new InvalidOperationException("Compiler-host output paths must be relative.");
            }
            var path = Path.GetFullPath(relativePath, OutputDirectory);
            if (!IsWithin(path, OutputDirectory) || PreparedFieldTypes.HasUnstablePath(path))
            {
                throw new InvalidOperationException("Compiler-host output escaped its isolated directory.");
            }
            return path;
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

        private static bool IsWithin(string path, string directory)
        {
            var comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
            var root = Path.TrimEndingDirectorySeparator(Path.GetFullPath(directory));
            var candidate = Path.GetFullPath(path);
            return candidate.Equals(root, comparison) || candidate.StartsWith(root + Path.DirectorySeparatorChar, comparison);
        }
    }
}
