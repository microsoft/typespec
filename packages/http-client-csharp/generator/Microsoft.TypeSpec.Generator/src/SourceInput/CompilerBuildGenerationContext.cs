// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    // Invocation-local ownership only. This context is not a build-host
    // certificate and cannot authorize publication or consuming compilation.
    internal sealed class CompilerBuildGenerationContext(
        string outputDirectory, CompilerBuildInputProof.ITrustedCompilerBuildSession session)
    {
        internal string OutputDirectory { get; } = outputDirectory;
        internal CompilerBuildInputProof.ITrustedCompilerBuildSession Session { get; } = session;
        internal CompilerBuildInputProof.BootstrapAssets? BootstrapAssets { get; set; }
        internal CompleteSourceInputSnapshot? SourceProof { get; set; }
        internal bool UsedCapturedResidualInputs { get; set; }
    }
}
