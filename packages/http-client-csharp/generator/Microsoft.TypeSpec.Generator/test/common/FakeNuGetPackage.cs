// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
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
        public static string Create(string nugetCacheDir, string packageName, string version, string sourceCode)
        {
            var pkgDir = Path.Combine(
                nugetCacheDir, packageName.ToLowerInvariant(), version, "lib", "netstandard2.0");
            Directory.CreateDirectory(pkgDir);

            var compilation = CSharpCompilation.Create(
                packageName,
                [CSharpSyntaxTree.ParseText(sourceCode)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
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
