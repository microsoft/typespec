// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
        public static string Create(
            string nugetCacheDir,
            string packageName,
            string version,
            string sourceCode,
            IEnumerable<string>? referencedAssemblyPaths = null)
        {
            var pkgDir = Path.Combine(
                nugetCacheDir, packageName.ToLowerInvariant(), version, "lib", "netstandard2.0");
            Directory.CreateDirectory(pkgDir);

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
    }
}
