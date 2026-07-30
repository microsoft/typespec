// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Common
{
    /// <summary>
    /// Test helper that emits a fake NuGet package layout
    /// (<c>{nugetCacheDir}/{lower(packageName)}/{version}/lib/netstandard2.0/{packageName}.dll</c>)
    /// containing the supplied C# source. Used by tests that need to populate the NuGet global
    /// packages folder without hitting the network.
    /// </summary>
    public static class FakeNuGetPackage
    {
        /// <summary>
        /// Compiles <paramref name="sourceCode"/> into a netstandard2.0 assembly and writes it to the
        /// NuGet cache layout. Returns the absolute path to the emitted dll.
        /// </summary>
        /// <param name="nugetCacheDir">The fake NuGet global packages folder to write into.</param>
        /// <param name="packageName">The package id, which is also used as the assembly name.</param>
        /// <param name="version">The package version, used as the version directory name.</param>
        /// <param name="sourceCode">The C# source to compile into the package assembly.</param>
        /// <param name="referencedAssemblyPaths">
        /// Paths to other assemblies the source depends on. Use this to build a package whose public
        /// types derive from types in another fake package, which is how the dependency-resolution
        /// behavior of the external-type resolver is exercised.
        /// </param>
        /// <param name="dependencies">
        /// Package id / version-range pairs to declare in the emitted <c>.nuspec</c>'s
        /// <c>.NETStandard2.0</c> dependency group, e.g. <c>("Other.Package", "[2.0.0, )")</c>. The
        /// resolver reads these to pin each dependency to a package version, so use them whenever a test
        /// needs the package version to differ from the assembly version it ships.
        /// </param>
        public static string Create(
            string nugetCacheDir,
            string packageName,
            string version,
            string sourceCode,
            IEnumerable<string>? referencedAssemblyPaths = null,
            IEnumerable<(string Id, string VersionRange)>? dependencies = null)
        {
            var versionDir = Path.Combine(nugetCacheDir, packageName.ToLowerInvariant(), version);
            var pkgDir = Path.Combine(versionDir, "lib", "netstandard2.0");
            Directory.CreateDirectory(pkgDir);
            WriteNuspec(versionDir, packageName, version, dependencies);
            WritePackageMetadata(versionDir);

            var references = new List<MetadataReference>
            {
                MetadataReference.CreateFromFile(typeof(object).Assembly.Location)
            };
            if (referencedAssemblyPaths != null)
            {
                references.AddRange(referencedAssemblyPaths.Select(p => MetadataReference.CreateFromFile(p)));
            }

            var compilation = CSharpCompilation.Create(
                packageName,
                [CSharpSyntaxTree.ParseText(sourceCode)],
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            var dllPath = Path.Combine(pkgDir, $"{packageName}.dll");
            using (var fs = new FileStream(dllPath, FileMode.Create))
            {
                var result = compilation.Emit(fs);
                Assert.IsTrue(result.Success, $"Failed to emit fake assembly for {packageName}");
            }
            return dllPath;
        }

        /// <summary>
        /// Writes the <c>.nuspec</c> that a restored package always carries in its version directory. The
        /// external-type resolver walks these to build the dependency closure, so a package without one is
        /// resolved only by the assembly-version fallback path.
        /// </summary>
        private static void WriteNuspec(
            string versionDir,
            string packageName,
            string version,
            IEnumerable<(string Id, string VersionRange)>? dependencies)
        {
            var dependencyElements = string.Concat(
                (dependencies ?? []).Select(d =>
                    $"      <dependency id=\"{d.Id}\" version=\"{d.VersionRange}\" />{Environment.NewLine}"));

            var nuspec =
                $"""
                <?xml version="1.0" encoding="utf-8"?>
                <package xmlns="http://schemas.microsoft.com/packaging/2013/05/nuspec.xsd">
                  <metadata>
                    <id>{packageName}</id>
                    <version>{version}</version>
                    <authors>Test</authors>
                    <description>Fake package emitted by tests.</description>
                    <dependencies>
                      <group targetFramework=".NETStandard2.0">
                {dependencyElements}      </group>
                    </dependencies>
                  </metadata>
                </package>
                """;

            File.WriteAllText(Path.Combine(versionDir, $"{packageName.ToLowerInvariant()}.nuspec"), nuspec);
        }

        private static void WritePackageMetadata(string versionDir)
        {
            var metadata =
                """
                {
                  "version": 2,
                  "contentHash": "VGVzdCBwYWNrYWdlIGNvbnRlbnQgaGFzaA==",
                  "source": "https://example.invalid/v3/index.json"
                }
                """;
            File.WriteAllText(Path.Combine(versionDir, ".nupkg.metadata"), metadata);
        }
    }
}
