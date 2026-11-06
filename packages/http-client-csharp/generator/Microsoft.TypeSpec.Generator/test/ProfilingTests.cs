// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class ProfilingTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task DocumentProfilingPreservesOutput(bool disableRoslynReduce)
        {
            var outputPath = Path.Combine(Path.GetTempPath(), "typespec-profile-test", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(outputPath);
            try
            {
                MockHelpers.LoadMockGenerator(
                    outputPath: outputPath,
                    configuration: $"{{\"package-name\":\"Profiling.Test\",\"disable-roslyn-reduce\":{disableRoslynReduce.ToString().ToLowerInvariant()}}}");

                var unprofiled = await ProcessDocuments(null);
                var profile = new GeneratedCodeWorkspacePostProcessingProfile();
                var profiled = await ProcessDocuments(profile);

                CollectionAssert.AreEqual(unprofiled, profiled);
                Assert.AreEqual(3, profiled.Count);
                StringAssert.Contains("ProcessDocument.Total, 2,", profile.GetSummary());
                if (disableRoslynReduce)
                {
                    StringAssert.DoesNotContain("Roslyn.Simplifier.ReduceAsync", profile.GetSummary());
                }
                else
                {
                    StringAssert.Contains("Roslyn.Simplifier.ReduceAsync, 2,", profile.GetSummary());
                }
            }
            finally
            {
                GeneratedCodeWorkspace.PostProcessingProfile = null;
                Directory.Delete(outputPath, recursive: true);
            }
        }

        private static async Task<List<(string Name, string Text)>> ProcessDocuments(GeneratedCodeWorkspacePostProcessingProfile? profile)
        {
            GeneratedCodeWorkspace.PostProcessingProfile = profile;
            GeneratedCodeWorkspace.Initialize();
            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
            await workspace.AddGeneratedFile(new CodeFile("namespace Profiling.Test { public class First { public global::System.String Name { get; set; } } }", "First.cs"));
            await workspace.AddGeneratedFile(new CodeFile("namespace Profiling.Test { public class Second { public global::System.Int32 Value { get; set; } } }", "Second.cs"));
            workspace.AddPlainFiles("plain.txt", "unchanged");
            var files = new List<(string Name, string Text)>();
            await foreach (var file in workspace.GetGeneratedFilesAsync())
            {
                files.Add(file);
            }
            return files;
        }
    }
}
