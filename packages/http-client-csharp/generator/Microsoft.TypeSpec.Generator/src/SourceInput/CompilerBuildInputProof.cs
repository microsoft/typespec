// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;
using System.Linq;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using NuGet.Versioning;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    /// <summary>
    /// Constructs a proof from a trusted host's actual non-generated compiler
    /// inputs. This does not compile generated output or create a semantic model.
    /// </summary>
    internal static class CompilerBuildInputProof
    {
        // Only a build-owned session at the actual compiler boundary can implement
        // this contract. Ordinary configuration is not evidence of completeness.
        internal interface ITrustedCompilerBuildSession
        {
            CompilerBuildInputCapture Capture { get; }
            bool IsCurrent();
        }

        internal sealed record CapturedCompilerSource(string Path, string Sha256);
        internal sealed record CapturedCompilerReference(string Path, string Sha256, IReadOnlyList<string> Aliases, bool EmbedInteropTypes);
        internal sealed record CompilerBuildInputCapture(
            string OutputDirectory,
            string Epoch,
            string Configuration,
            string LanguageVersion,
            string AssemblyName,
            IReadOnlyList<string> PreprocessorSymbols,
            IReadOnlyList<CapturedCompilerSource> Sources,
            IReadOnlyList<CapturedCompilerReference> References,
            bool HasAnalyzers,
            bool HasUnsupportedInputs,
            CSharpParseOptions ParseOptions,
            CSharpCompilationOptions CompilationOptions,
            CapturedCompilerSource? ProjectAssetsFile = null);
        private const long MaximumSourceBytes = 16 * 1024 * 1024;
        private const long MaximumReferenceBytes = 256 * 1024 * 1024;
        private const int MaximumInputCount = 50000;
        private const long MaximumAssetsBytes = 256 * 1024 * 1024;
        private static readonly UTF8Encoding StrictUtf8 = new(false, true);

        internal sealed class BootstrapAssets(string path, byte[] contents, Func<bool> isCurrent)
        {
            internal string Path { get; } = path;
            internal ReadOnlyMemory<byte> Contents { get; } = contents;
            internal bool IsCurrent() => isCurrent();
        }

        // Bootstrap is independent of field eligibility: a disabled optimization
        // still needs the build-owned assets, but must never trigger nested MSBuild.
        internal static BootstrapAssets? TryCaptureBootstrapAssets(ITrustedCompilerBuildSession? session, string outputDirectory, string projectFile)
        {
            if (session is null)
            {
                return null;
            }
            try
            {
                var capture = session.Capture;
                var assets = capture?.ProjectAssetsFile;
                if (capture is null || assets is null || !SessionIsCurrent(session) ||
                    string.IsNullOrWhiteSpace(capture.Epoch) || string.IsNullOrWhiteSpace(capture.Configuration) ||
                    !Path.IsPathFullyQualified(capture.OutputDirectory) || !Path.IsPathFullyQualified(outputDirectory) ||
                    !string.Equals(Path.GetFullPath(capture.OutputDirectory), Path.GetFullPath(outputDirectory), PathComparison) ||
                    !IsUsablePath(projectFile) || !IsUsablePath(assets.Path))
                {
                    return null;
                }
                var path = assets.Path;
                var hash = assets.Sha256;
                var bytes = ReadVerifiedFile(path, hash, MaximumAssetsBytes);
                if (bytes is null || !AssetsBelongToProject(bytes, projectFile))
                {
                    return null;
                }
                var invalidated = 0;
                bool IsCurrent()
                {
                    if (Volatile.Read(ref invalidated) != 0)
                    {
                        return false;
                    }
                    if (!SessionIsCurrent(session) || !IsUsablePath(path) || !MatchesHash(path, hash))
                    {
                        Interlocked.Exchange(ref invalidated, 1);
                        return false;
                    }
                    return true;
                }
                return IsCurrent() ? new BootstrapAssets(path, bytes, IsCurrent) : null;
            }
            catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or ArgumentException or
                InvalidOperationException or NotSupportedException or JsonException or System.Security.SecurityException)
            {
                return null;
            }
        }

        private static bool AssetsBelongToProject(byte[] bytes, string projectFile)
        {
            using var document = JsonDocument.Parse(bytes);
            return document.RootElement.ValueKind == JsonValueKind.Object && HasSupportedAssetInventory(document.RootElement) &&
                document.RootElement.TryGetProperty("project", out var project) && project.ValueKind == JsonValueKind.Object &&
                project.TryGetProperty("restore", out var restore) && restore.ValueKind == JsonValueKind.Object &&
                restore.TryGetProperty("projectPath", out var path) && path.ValueKind == JsonValueKind.String &&
                path.GetString() is { } capturedProject && Path.IsPathFullyQualified(capturedProject) &&
                string.Equals(Path.GetFullPath(capturedProject), Path.GetFullPath(projectFile), PathComparison);
        }

        // Reject unsupported shapes that ReadProjectAssets would silently skip.
        // Shape validation does not establish inventory completeness; that is a
        // separate obligation of the trusted build session.
        private static bool HasSupportedAssetInventory(JsonElement root)
        {
            var sawTargets = false;
            var sawGroups = false;
            foreach (var property in root.EnumerateObject())
            {
                if (property.NameEquals("targets"))
                {
                    if (sawTargets || property.Value.ValueKind != JsonValueKind.Object)
                    {
                        return false;
                    }
                    sawTargets = true;
                    foreach (var target in property.Value.EnumerateObject())
                    {
                        if (target.Value.ValueKind != JsonValueKind.Object)
                        {
                            return false;
                        }
                        foreach (var library in target.Value.EnumerateObject())
                        {
                            var nameAndVersion = library.Name.Split('/');
                            if (nameAndVersion.Length != 2 || nameAndVersion.Any(string.IsNullOrWhiteSpace) ||
                                library.Value.ValueKind != JsonValueKind.Object ||
                                library.Value.EnumerateObject().Count(member => member.NameEquals("type")) != 1 ||
                                !library.Value.TryGetProperty("type", out var type) || type.ValueKind != JsonValueKind.String ||
                                type.GetString() is not ("package" or "project") ||
                                type.GetString() == "package" && !NuGetVersion.TryParse(nameAndVersion[1], out _))
                            {
                                return false;
                            }
                        }
                    }
                }
                else if (property.NameEquals("projectFileDependencyGroups"))
                {
                    if (sawGroups || property.Value.ValueKind != JsonValueKind.Object)
                    {
                        return false;
                    }
                    sawGroups = true;
                    foreach (var group in property.Value.EnumerateObject())
                    {
                        if (group.Value.ValueKind != JsonValueKind.Array ||
                            group.Value.EnumerateArray().Any(item => !IsSupportedDependencyGroupEntry(item)))
                        {
                            return false;
                        }
                    }
                }
            }
            return sawTargets;
        }

        private static bool IsSupportedDependencyGroupEntry(JsonElement item)
        {
            if (item.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(item.GetString()))
            {
                return false;
            }
            // Mirror the workspace reader: only a three-token >= entry is used
            // as a fixed package version by the local resolver.
            var parts = item.GetString()!.Split();
            return !string.IsNullOrEmpty(parts[0]) &&
                (parts.Length != 3 || parts[1] != ">=" || NuGetVersion.TryParse(parts[2], out _));
        }

        internal static CompleteSourceInputSnapshot? TryCreate(ITrustedCompilerBuildSession? session, string outputDirectory)
        {
            if (session is null)
            {
                return null;
            }

            try
            {
                var capture = session.Capture;
                if (capture is null || capture.Sources is null || capture.References is null || capture.PreprocessorSymbols is null ||
                    capture.ParseOptions is null || capture.CompilationOptions is null ||
                    capture.Sources.Any(source => source is null) || capture.References.Any(reference => reference is null) ||
                    !SessionIsCurrent(session) || capture.HasAnalyzers || capture.HasUnsupportedInputs ||
                    string.IsNullOrWhiteSpace(capture.Epoch) || string.IsNullOrWhiteSpace(capture.Configuration) ||
                    string.IsNullOrWhiteSpace(capture.AssemblyName) ||
                    !Path.IsPathFullyQualified(capture.OutputDirectory) || !Path.IsPathFullyQualified(outputDirectory) ||
                    !string.Equals(Path.GetFullPath(capture.OutputDirectory), Path.GetFullPath(outputDirectory), PathComparison) ||
                    !IsSupportedLanguageVersion(capture.LanguageVersion, out var languageVersion) ||
                    capture.Sources.Count > MaximumInputCount || capture.References.Count > MaximumInputCount)
                {
                    return null;
                }

                // Copy the host data: later mutation of a transport/list must not
                // silently change which bytes the snapshot claims to cover.
                var sources = capture.Sources.Select(source => new CapturedCompilerSource(source.Path, source.Sha256)).ToArray();
                var references = capture.References.Select(reference => new CapturedCompilerReference(
                    reference.Path, reference.Sha256, reference.Aliases.ToArray(), reference.EmbedInteropTypes)).ToArray();
                var symbols = capture.PreprocessorSymbols.ToArray();
                var projectAssets = capture.ProjectAssetsFile is null ? null :
                    new CapturedCompilerSource(capture.ProjectAssetsFile.Path, capture.ProjectAssetsFile.Sha256);
                if (projectAssets is not null &&
                    (!IsUsablePath(projectAssets.Path) || !MatchesHash(projectAssets.Path, projectAssets.Sha256)))
                {
                    return null;
                }
                if (symbols.Any(symbol => string.IsNullOrEmpty(symbol) || !SyntaxFacts.IsValidIdentifier(symbol)) ||
                    capture.ParseOptions.LanguageVersion != languageVersion ||
                    !capture.ParseOptions.PreprocessorSymbolNames.SequenceEqual(symbols, StringComparer.Ordinal) ||
                    capture.ParseOptions.Features.Any() || capture.CompilationOptions.OutputKind != OutputKind.DynamicallyLinkedLibrary ||
                    capture.CompilationOptions.Usings.Length != 0)
                {
                    return null;
                }
                // Match Csc source deduplication rather than the host filesystem's
                // casing rules; other path identities keep their existing comparer.
                var paths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var generatedDirectory = Path.GetFullPath(Path.Combine(outputDirectory, "src", "Generated"));
                foreach (var source in sources)
                {
                    if (!IsUsablePath(source.Path) || IsWithin(source.Path, generatedDirectory) || !paths.Add(Path.GetFullPath(source.Path)))
                    {
                        return null;
                    }
                }
                foreach (var reference in references)
                {
                    if (!IsUsablePath(reference.Path))
                    {
                        return null;
                    }
                }

                var parseOptions = capture.ParseOptions;
                var trees = new List<SyntaxTree>(sources.Length);
                foreach (var source in sources)
                {
                    var bytes = ReadSource(source);
                    if (bytes is null)
                    {
                        return null;
                    }
                    var offset = bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF ? 3 : 0;
                    var text = StrictUtf8.GetString(bytes, offset, bytes.Length - offset);
                    trees.Add(CSharpSyntaxTree.ParseText(SourceText.From(text, Encoding.UTF8, SourceHashAlgorithm.Sha256),
                        parseOptions, path: source.Path));
                }

                var metadata = new List<MetadataReference>(references.Length);
                foreach (var reference in references)
                {
                    var image = ReadVerifiedFile(reference.Path, reference.Sha256, MaximumReferenceBytes);
                    if (image is null)
                    {
                        return null;
                    }
                    using (var stream = new MemoryStream(image, writable: false))
                    using (var pe = new PEReader(stream))
                    {
                        if (!pe.HasMetadata)
                        {
                            return null;
                        }
                        var reader = pe.GetMetadataReader();
                        if (!reader.IsAssembly || reader.AssemblyFiles.Any(handle => reader.GetAssemblyFile(handle).ContainsMetadata))
                        {
                            // Multi-module assemblies require additional inputs
                            // not covered by the manifest DLL's hash.
                            return null;
                        }
                    }
                    var properties = new MetadataReferenceProperties(MetadataImageKind.Assembly,
                        reference.Aliases.ToImmutableArray(), reference.EmbedInteropTypes);
                    // Parse exactly the bytes whose hash was checked, rather than
                    // reopening the path between verification and metadata load.
                    metadata.Add(MetadataReference.CreateFromImage(ImmutableArray.CreateRange(image), properties, filePath: reference.Path));
                }

                var compilation = CSharpCompilation.Create(capture.AssemblyName, trees, metadata, capture.CompilationOptions);
                if (trees.Any(tree => tree.GetDiagnostics().Any(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)) ||
                    metadata.Any(reference => compilation.GetAssemblyOrModuleSymbol(reference) is null))
                {
                    return null;
                }
                var invalidated = 0;
                bool IsCurrent()
                {
                    if (Volatile.Read(ref invalidated) != 0)
                    {
                        return false;
                    }
                    if (!SessionIsCurrent(session) || sources.Any(source => !IsUsablePath(source.Path) || !MatchesHash(source.Path, source.Sha256)) ||
                        references.Any(reference => !IsUsablePath(reference.Path) || !MatchesHash(reference.Path, reference.Sha256)) ||
                        projectAssets is not null && (!IsUsablePath(projectAssets.Path) || !MatchesHash(projectAssets.Path, projectAssets.Sha256)))
                    {
                        Interlocked.Exchange(ref invalidated, 1);
                        return false;
                    }
                    return true;
                }

                if (!IsCurrent())
                {
                    return null;
                }
                return new CompleteSourceInputSnapshot(outputDirectory, capture.Epoch, compilation, [capture.Configuration], IsCurrent, projectAssets?.Path, parseOptions);
            }
            catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or ArgumentException or
                InvalidOperationException or NotSupportedException or BadImageFormatException or System.Security.SecurityException)
            {
                // A failed or unsupported capture is not proof; preserve the normal path.
                return null;
            }
        }

        private static StringComparison PathComparison => OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

        private static bool IsSupportedLanguageVersion(string value, out LanguageVersion version)
        {
            version = default;
            return !string.IsNullOrEmpty(value) && value.All(character => char.IsAsciiDigit(character) || character == '.') &&
                LanguageVersionFacts.TryParse(value, out version) && version is not (LanguageVersion.Default or LanguageVersion.Latest or
                    LanguageVersion.LatestMajor or LanguageVersion.Preview);
        }

        private static bool SessionIsCurrent(ITrustedCompilerBuildSession session)
        {
            try
            {
                return session.IsCurrent();
            }
            catch (Exception)
            {
                return false;
            }
        }

        internal static bool IsUsablePath(string path) =>
            !string.IsNullOrWhiteSpace(path) && Path.IsPathFullyQualified(path) && !HasSymlinkOrUnknownPath(path);

        private static bool IsWithin(string path, string directory)
        {
            var candidate = Path.GetFullPath(path);
            var root = Path.TrimEndingDirectorySeparator(Path.GetFullPath(directory));
            return candidate.Equals(root, PathComparison) ||
                candidate.StartsWith(root + Path.DirectorySeparatorChar, PathComparison);
        }

        private static bool HasSymlinkOrUnknownPath(string path)
        {
            for (string? current = Path.GetFullPath(path); current is not null; current = Path.GetDirectoryName(current))
            {
                try
                {
                    if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                    {
                        return true;
                    }
                }
                catch (FileNotFoundException) { return true; }
                catch (DirectoryNotFoundException) { return true; }
                catch (IOException) { return true; }
                catch (UnauthorizedAccessException) { return true; }
                catch (System.Security.SecurityException) { return true; }
            }
            return false;
        }

        private static byte[]? ReadSource(CapturedCompilerSource source) =>
            ReadVerifiedFile(source.Path, source.Sha256, MaximumSourceBytes);

        private static byte[]? ReadVerifiedFile(string path, string expected, long maximumBytes)
        {
            var info = new FileInfo(path);
            if (!info.Exists || info.Length > maximumBytes)
            {
                return null;
            }
            var bytes = File.ReadAllBytes(path);
            return bytes.LongLength <= maximumBytes && HashMatches(bytes, expected) ? bytes : null;
        }

        private static bool MatchesHash(string path, string expected)
        {
            try
            {
                using var stream = File.OpenRead(path);
                var actual = SHA256.HashData(stream);
                return HashMatches(actual, expected, alreadyHashed: true);
            }
            catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or System.Security.SecurityException)
            {
                return false;
            }
        }

        private static bool HashMatches(byte[] value, string expected, bool alreadyHashed = false)
        {
            if (expected is null || expected.Length != 64)
            {
                return false;
            }
            try
            {
                var actual = alreadyHashed ? value : SHA256.HashData(value);
                return CryptographicOperations.FixedTimeEquals(actual, Convert.FromHexString(expected));
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }
}
