// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class ProviderReducerTests
    {
        private const string ReducerEnvironmentVariable = "TYPESPEC_PROVIDER_REDUCER";

        [TestCase(0)] // No writer metadata.
        [TestCase(1)] // using static.
        [TestCase(2)] // Custom rewriter still gets its semantic model.
        [TestCase(3)] // Invalid reference spans.
        [TestCase(4)] // Interface document.
        [TestCase(5)] // Mixed global/namespace declarations.
        [TestCase(6)] // Removing an empty namespace invalidates original spans.
        public async Task UncertainDocumentsKeepQualifiedNamesWithoutRoslyn(int mode)
        {
            var previous = Environment.GetEnvironmentVariable(ReducerEnvironmentVariable);
            var directory = Path.Combine(Path.GetTempPath(), "typespec-provider-reducer", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                Environment.SetEnvironmentVariable(ReducerEnvironmentVariable, "true");
                MockHelpers.LoadMockGenerator(outputPath: directory,
                    configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true}");
                using var writer = new CodeWriter();
                if (mode == 6)
                {
                    writer.WriteRawLine("namespace Empty { }");
                }
                if (mode == 1)
                {
                    writer.WriteRawLine("using static System.Math;");
                }
                if (mode == 5)
                {
                    writer.WriteRawLine("namespace Sample { public class Anchor {} }");
                    writer.WriteRawLine("public class Clock {");
                }
                else
                {
                    writer.WriteRawLine(mode == 4 ? "namespace Sample { public interface Clock {" : "namespace Sample { public class Clock {");
                }
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine(mode == 5 ? "}" : "} }");
                var text = writer.ToString();
                var references = mode == 0 ? null : writer.TypeReferences;
                if (mode == 3)
                {
                    references = references!.Select(static site => site with
                    {
                        Span = new Microsoft.CodeAnalysis.Text.TextSpan(site.Span.Start + 1, site.Span.Length)
                    }).ToArray();
                }
                var probe = new SemanticProbeRewriter();
                if (mode == 2)
                {
                    CodeModelGenerator.Instance.AddRewriter(probe);
                }
                var code = new CodeFile(text, "Clock.cs", references);
                var profile = new GeneratedCodeWorkspacePostProcessingProfile();
                GeneratedCodeWorkspace.PostProcessingProfile = profile;
                GeneratedCodeWorkspace.Initialize();
                var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
                await workspace.AddGeneratedFile(code);
                await foreach (var file in workspace.GetGeneratedFilesAsync())
                {
                    StringAssert.Contains("global::System.DateTimeOffset", file.Text);
                    if (mode == 6)
                    {
                        StringAssert.DoesNotContain("namespace Empty", file.Text);
                    }
                }
                if (mode == 6)
                {
                    StringAssert.DoesNotContain("ProviderReducer.Scope", profile.GetSummary());
                }
                StringAssert.Contains("ProviderReducer.KeepQualified", profile.GetSummary());
                StringAssert.DoesNotContain("Roslyn.Simplifier.ReduceAsync", profile.GetSummary());
                StringAssert.DoesNotContain("ProviderReducer.Reduce,", profile.GetSummary());
                if (mode == 2)
                {
                    Assert.True(probe.SawSemanticModel);
                }
                else
                {
                    StringAssert.DoesNotContain("GetSemanticModelAsync", profile.GetSummary());
                }
            }
            finally
            {
                GeneratedCodeWorkspace.PostProcessingProfile = null;
                Environment.SetEnvironmentVariable(ReducerEnvironmentVariable, previous);
                Directory.Delete(directory, recursive: true);
            }
        }

        private sealed class SemanticProbeRewriter : LibraryRewriter
        {
            internal bool SawSemanticModel { get; private set; }

            public override SyntaxNode? VisitCompilationUnit(CompilationUnitSyntax node)
            {
                SawSemanticModel = SemanticModel != null;
                return base.VisitCompilationUnit(node);
            }
        }

        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public async Task OptInSimpleModelUsesProviderReducerInsteadOfRoslyn(bool useProviderReducer, bool arrayReference)
        {
            var previous = Environment.GetEnvironmentVariable(ReducerEnvironmentVariable);
            var directory = Path.Combine(Path.GetTempPath(), "typespec-provider-reducer", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                Environment.SetEnvironmentVariable(ReducerEnvironmentVariable, useProviderReducer ? "true" : "false");
                var model = InputFactory.Model("Clock", properties:
                    [InputFactory.Property("Timestamp", new InputDateTimeType(DateTimeKnownEncoding.Rfc3339, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String))]);
                MockHelpers.LoadMockGenerator(inputModelTypes: [model], outputPath: directory,
                    configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true}");
                var provider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
                var code = new TypeProviderWriter(provider).Write();
                if (arrayReference)
                {
                    using var writer = new CodeWriter();
                    using (writer.SetNamespace("Sample"))
                    {
                        writer.WriteRawLine("public class Clock {");
                        writer.WriteLine($"public {typeof(DateTimeOffset[])} Timestamps => default;");
                        writer.WriteLine($"public {typeof(TimeSpan)} Duration => default;");
                        writer.WriteRawLine("}");
                    }
                    code = new CodeFile(writer.ToString(), "Clock.cs", writer.TypeReferences);
                }
                var profile = new GeneratedCodeWorkspacePostProcessingProfile();
                GeneratedCodeWorkspace.PostProcessingProfile = profile;
                GeneratedCodeWorkspace.Initialize();
                var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
                await workspace.AddGeneratedFile(code);
                string? output = null;
                await foreach (var file in workspace.GetGeneratedFilesAsync())
                {
                    output = file.Text;
                }

                Assert.NotNull(output);
                StringAssert.Contains("DateTimeOffset", output);
                StringAssert.DoesNotContain("global::System.DateTimeOffset", output);
                if (arrayReference)
                {
                    StringAssert.Contains("DateTimeOffset[] Timestamps", output);
                    StringAssert.Contains("TimeSpan Duration", output);
                    StringAssert.DoesNotContain("global::System.TimeSpan", output);
                }
                if (useProviderReducer)
                {
                    StringAssert.Contains("ProviderReducer.Reduce", profile.GetSummary());
                    StringAssert.DoesNotContain("Roslyn.Simplifier.ReduceAsync", profile.GetSummary());
                    StringAssert.DoesNotContain("GetSemanticModelAsync", profile.GetSummary());
                }
                else
                {
                    StringAssert.Contains("Roslyn.Simplifier.ReduceAsync", profile.GetSummary());
                    StringAssert.DoesNotContain("ProviderReducer.Reduce,", profile.GetSummary());
                }
            }
            finally
            {
                GeneratedCodeWorkspace.PostProcessingProfile = null;
                Environment.SetEnvironmentVariable(ReducerEnvironmentVariable, previous);
                Directory.Delete(directory, recursive: true);
            }
        }
    }
}
