// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    /// <summary>
    /// A trusted build host's immutable input snapshot for pre-emission lookup.
    /// The producer must cover all consumers of the output, including linked and
    /// generated sources, compiler options and relevant references, ensure output
    /// files have distinct physical identities (including hard links), and keep
    /// revalidation accurate through emission and compilation. The host must also
    /// exclude concurrent provider mutation and opaque callbacks that emit extra
    /// declarations outside the provider model. A directory scan or the existing
    /// customization compilation alone is not such a guarantee.
    /// Captured compiler-build sessions and controlled tests supply this snapshot;
    /// ordinary generation has no equivalent consumer proof.
    /// </summary>
    internal sealed class CompleteSourceInputSnapshot
    {
        private readonly Func<bool> _isCurrent;
        private readonly string _outputDirectory;
        private readonly string[] _configurations;

        internal CompleteSourceInputSnapshot(string outputDirectory, string buildEpoch,
            CSharpCompilation compilation, IReadOnlyList<string> configurations, Func<bool> isCurrent, string? projectAssetsFile = null,
            CSharpParseOptions? parseOptions = null)
        {
            _outputDirectory = Path.GetFullPath(outputDirectory);
            BuildEpoch = buildEpoch;
            Compilation = compilation;
            ProjectAssetsFile = projectAssetsFile;
            ParseOptions = parseOptions;
            _configurations = configurations.ToArray();
            _isCurrent = isCurrent;
        }

        internal string BuildEpoch { get; }
        internal CSharpCompilation Compilation { get; }
        internal string? ProjectAssetsFile { get; }
        internal CSharpParseOptions? ParseOptions { get; }

        internal bool IsCurrentFor(string outputDirectory)
        {
            if (string.IsNullOrWhiteSpace(BuildEpoch) || _configurations.Length == 0 ||
                _configurations.Any(string.IsNullOrWhiteSpace) ||
                !string.Equals(_outputDirectory, Path.GetFullPath(outputDirectory), StringComparison.Ordinal))
            {
                return false;
            }
            try
            {
                return _isCurrent();
            }
            catch (Exception)
            {
                // An unavailable host fact cannot authorize a shorter spelling.
                return false;
            }
        }
    }
}
