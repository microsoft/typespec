// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using static Microsoft.TypeSpec.Generator.SourceInput.CompilerBuildInputProof;

namespace Microsoft.TypeSpec.Generator.SourceInput
{
    /// <summary>
    /// Captures the inputs from the compiler invocation. This data is not itself
    /// a completeness proof: a live build-owned session must also isolate output
    /// and validate the captured inputs through the consuming compilation.
    /// </summary>
    internal static class CompilerCommandLineCapture
    {
        private const long MaximumResponseBytes = 16 * 1024 * 1024;

        internal sealed record Result(CompilerBuildInputCapture Inputs, IReadOnlyList<string> GeneratedSources,
            IReadOnlyList<CapturedCompilerSource> GeneratedInputs, IReadOnlyList<string> ResponseTokens, string ResponsePath, string ResponseSha256);

        internal static Result? TryCapture(IReadOnlyList<string> arguments, string workingDirectory,
            string outputDirectory, string epoch, string configuration)
        {
            try
            {
                // The first host slice accepts only the shape issued by the SDK
                // Csc task with shared compilation disabled. Other invocation forms
                // continue through the ordinary compiler, without preparation.
                if (arguments.Count != 2 || !string.Equals(arguments[0], "/noconfig", StringComparison.OrdinalIgnoreCase) ||
                    !arguments[1].StartsWith('@') || !Path.IsPathFullyQualified(workingDirectory) ||
                    !Path.IsPathFullyQualified(outputDirectory) || string.IsNullOrWhiteSpace(epoch) || string.IsNullOrWhiteSpace(configuration))
                {
                    return null;
                }
                var responsePath = Path.GetFullPath(arguments[1][1..], workingDirectory);
                if (!IsUsablePath(responsePath))
                {
                    return null;
                }
                byte[] responseBytes;
                using (var stream = File.OpenRead(responsePath))
                {
                    if (!stream.CanSeek || stream.Length > MaximumResponseBytes)
                    {
                        return null;
                    }
                    responseBytes = new byte[(int)stream.Length];
                    stream.ReadExactly(responseBytes);
                    if (stream.ReadByte() != -1)
                    {
                        return null;
                    }
                }
                string response;
                using (var reader = new StreamReader(new MemoryStream(responseBytes, writable: false), Encoding.UTF8, detectEncodingFromByteOrderMarks: true))
                {
                    response = reader.ReadToEnd();
                }
                // Roslyn treats response-file comments as line-scoped. Splitting
                // the entire file at once would discard inputs after a comment.
                var tokenList = new List<string>();
                using (var lines = new StringReader(response))
                {
                    string? line;
                    while ((line = lines.ReadLine()) is not null)
                    {
                        tokenList.AddRange(CommandLineParser.SplitCommandLineIntoArguments(line, removeHashComments: true));
                    }
                }
                var tokens = tokenList.ToArray();
                if (tokens.Any(token => token.StartsWith('@') || token.Contains('*') || token.Contains('?') ||
                    HasOption(token, "recurse") || HasOption(token, "addmodule") || HasUnrepresentedOption(token)))
                {
                    return null;
                }

                var languageOptions = tokens.Where(token => HasOption(token, "langversion")).ToArray();
                if (languageOptions.Length != 1)
                {
                    return null;
                }
                var language = languageOptions[0][(languageOptions[0].IndexOf(':') + 1)..];
                if (language.Length == 0 || !language.All(character => char.IsAsciiDigit(character) || character == '.'))
                {
                    return null;
                }

                // Parse the same immutable bytes used for replay; reopening the
                // response file here could describe a different compilation.
                var parseArguments = new[] { arguments[0] }.Concat(tokens);
                var parsed = CSharpCommandLineParser.Default.Parse(parseArguments, workingDirectory, null, null);
                if (parsed.Errors.Any(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error) ||
                    parsed.AnalyzerReferences.Length != 0 || parsed.AnalyzerConfigPaths.Length != 0 ||
                    parsed.CompilationOptions.OutputKind != OutputKind.DynamicallyLinkedLibrary ||
                    string.IsNullOrWhiteSpace(parsed.CompilationName) ||
                    parsed.CompilationOptions.Usings.Length != 0 || parsed.ParseOptions.Features.Any())
                {
                    return null;
                }

                var generatedDirectory = Path.GetFullPath(Path.Combine(outputDirectory, "src", "Generated"));
                // Csc deduplicates normalized source paths case-insensitively,
                // including on case-sensitive filesystems. Check before partitioning.
                var allPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var generated = new List<string>();
                var generatedInputs = new List<CapturedCompilerSource>();
                var sources = new List<CapturedCompilerSource>();
                foreach (var source in parsed.SourceFiles)
                {
                    var path = Path.GetFullPath(source.Path, workingDirectory);
                    if (!allPaths.Add(path) || !File.Exists(path) || !IsUsablePath(path))
                    {
                        return null;
                    }
                    if (IsWithin(path, generatedDirectory))
                    {
                        generated.Add(path);
                        generatedInputs.Add(new CapturedCompilerSource(path, Hash(path)));
                    }
                    else
                    {
                        sources.Add(new CapturedCompilerSource(path, Hash(path)));
                    }
                }
                if (generated.Count == 0)
                {
                    return null;
                }

                var references = new List<CapturedCompilerReference>();
                foreach (var reference in parsed.MetadataReferences)
                {
                    if (reference.Properties.Kind != MetadataImageKind.Assembly || !Path.IsPathFullyQualified(reference.Reference))
                    {
                        return null;
                    }
                    var path = Path.GetFullPath(reference.Reference);
                    if (!File.Exists(path) || !IsUsablePath(path))
                    {
                        return null;
                    }
                    references.Add(new CapturedCompilerReference(path, Hash(path), reference.Properties.Aliases.ToArray(),
                        reference.Properties.EmbedInteropTypes));
                }

                var input = new CompilerBuildInputCapture(Path.GetFullPath(outputDirectory), epoch, configuration,
                    language, parsed.CompilationName, parsed.ParseOptions.PreprocessorSymbolNames.ToArray(), sources.ToArray(), references.ToArray(),
                    false, false, parsed.ParseOptions, parsed.CompilationOptions);
                return new Result(input, generated.ToArray(), generatedInputs.ToArray(), tokens, responsePath,
                    Convert.ToHexString(SHA256.HashData(responseBytes)));
            }
            catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or ArgumentException or
                InvalidOperationException or NotSupportedException or BadImageFormatException or System.Security.SecurityException)
            {
                return null;
            }
        }

        private static bool HasUnrepresentedOption(string token)
        {
            var names = new[] { "codepage", "appconfig", "keyfile", "keycontainer", "publicsign", "delaysign",
                "moduleassemblyname", "embed", "sourcelink", "pathmap", "errorlog", "doc", "generatedfilesout" };
            return names.Any(name => IsOption(token, name)) ||
                IsOption(token, "debug") && !token.EndsWith("-", StringComparison.Ordinal);
        }

        private static bool IsOption(string token, string name)
        {
            if (token.Length < 2 || token[0] is not ('/' or '-'))
            {
                return false;
            }
            var body = token.AsSpan(1);
            return body.StartsWith(name, StringComparison.OrdinalIgnoreCase) &&
                (body.Length == name.Length || body.Length > name.Length && body[name.Length] is ':' or '+' or '-');
        }

        private static bool HasOption(string token, string name) =>
            token.Length > 1 && (token[0] == '/' || token[0] == '-') &&
            token.AsSpan(1).StartsWith(name + ":", StringComparison.OrdinalIgnoreCase);

        private static StringComparison PathComparison => OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

        private static bool IsWithin(string path, string directory)
        {
            var root = Path.TrimEndingDirectorySeparator(directory);
            return path.Equals(root, PathComparison) || path.StartsWith(root + Path.DirectorySeparatorChar, PathComparison);
        }

        private static string Hash(string path)
        {
            using var stream = File.OpenRead(path);
            return Convert.ToHexString(SHA256.HashData(stream));
        }
    }
}
