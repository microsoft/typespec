// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("global using System;")]
        [TestCase("using Moment=System.DateTimeOffset;")]
        [TestCase("using static System.Math;")]
        public async Task StructuralC5CrefUnsupportedImportInOtherDocumentRetains(string import)
        {
            var code = C5DiagnosticCrefCode("", "");
            var output = await Reduce(code, import + "\nclass Other{}");
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
        }

        [TestCase(DocumentationMode.Parse, false)]
        [TestCase(DocumentationMode.Diagnose, false)]
        [TestCase(DocumentationMode.None, false)]
        [TestCase(DocumentationMode.Parse, true)]
        [TestCase(DocumentationMode.Diagnose, true)]
        public void StructuralC5CrefDocumentationModeAndRealImportUse(DocumentationMode mode, bool genuinelyUsed)
        {
            var code = C5DiagnosticCrefCode("using System;", genuinelyUsed ? "public DateTimeOffset Value=>default;" : "");
            var output = ReduceC5CrefDirect(code, new CSharpParseOptions(LanguageVersion.Preview, mode), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            // Parse/Diagnose now permit the explicitly approved Hidden-CS8019
            // activation. None still has no parsed cref and must retain it.
            var before = C5CrefDiagnostics(code.Content);
            Assert.That(before.Any(static d => d.StartsWith("CS8019|Hidden|", StringComparison.Ordinal)), Is.EqualTo(!genuinelyUsed));
            var shouldShorten = mode != DocumentationMode.None;
            StringAssert.Contains(shouldShorten ? "cref=\"DateTimeOffset\"" : "cref=\"global::System.DateTimeOffset\"", output);
            if (shouldShorten)
            {
                Assert.That(C5CrefDiagnostics(output), Is.Empty);
                AssertStructuralCrefs(code.Content, output);
            }
            else
            {
                Assert.That(C5CrefDiagnostics(output), Is.EqualTo(before));
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void StructuralC5CrefFilteredUnusedDiagnosticsDoNotEstablishImportUse(bool provider)
        {
            var code = C5DiagnosticCrefCode("using System;", "");
            var options = new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary);
            options = provider ? options.WithSyntaxTreeOptionsProvider(new C5UnusedImportFilter()) :
                options.WithSpecificDiagnosticOptions(new[] { new KeyValuePair<string,ReportDiagnostic>("CS8019", ReportDiagnostic.Suppress) });
            var output = ReduceC5CrefDirect(code, new CSharpParseOptions(LanguageVersion.Preview, DocumentationMode.Diagnose), options);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
        }

        [TestCase("#pragma warning disable CS8019\n")]
        [TestCase("#line (100,1)-(200,10) 40 \"map.cs\"\n")]
        public async Task StructuralC5CrefUnsupportedReportingAndMappingRetains(string prefix)
        {
            var code = C5DiagnosticCrefCode(prefix + "using System;", "");
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void StructuralC5CrefNamespaceImportScopesWithGenuineUseStillSimplify(bool fileScoped)
        {
            var code = C5DiagnosticCrefCode("", "public DateTimeOffset Value=>default;");
            var prefix = fileScoped ? "namespace N;using System;\n" : "namespace N{using System;\n";
            var source = prefix + code.Content + (fileScoped ? "" : "}");
            var sites = code.TypeReferences!.Select(site => site with { Span = new TextSpan(site.Span.Start + prefix.Length, site.Span.Length) }).ToArray();
            var output = ReduceC5CrefDirect(new CodeFile(source, code.Name, sites), new CSharpParseOptions(LanguageVersion.Preview, DocumentationMode.Diagnose), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            StringAssert.Contains("cref=\"DateTimeOffset\"", output);
        }

        private static string ReduceC5CrefDirect(CodeFile code, CSharpParseOptions parse, CSharpCompilationOptions options)
        {
            var tree = CSharpSyntaxTree.ParseText(code.Content, parse, code.Name);
            var compilation = CSharpCompilation.Create("C5CrefSafety", new[] { tree }, References, options);
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), code.TypeReferences!);
            return rewriter?.Visit(tree.GetRoot())?.ToFullString() ?? code.Content;
        }

        private sealed class C5UnusedImportFilter : SyntaxTreeOptionsProvider
        {
            public override GeneratedKind IsGenerated(SyntaxTree tree, CancellationToken cancellationToken) => GeneratedKind.Unknown;
            public override bool TryGetDiagnosticValue(SyntaxTree tree, string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = diagnosticId == "CS8019" ? ReportDiagnostic.Suppress : ReportDiagnostic.Default;
                return diagnosticId == "CS8019";
            }
            public override bool TryGetGlobalDiagnosticValue(string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = ReportDiagnostic.Default;
                return false;
            }
        }
    }
}
