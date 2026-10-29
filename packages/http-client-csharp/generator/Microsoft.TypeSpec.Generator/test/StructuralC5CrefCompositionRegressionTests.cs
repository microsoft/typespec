// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        [TestCase("alias")]
        [TestCase("warning")]
        [TestCase("globalOtherDocument")]
        public async Task StructuralC5CrefRetentionAndOptionalDefaultKeepOriginalImportUse(string mode)
        {
            const string type = "global::System.DateTimeOffset";
            var imports = mode == "globalOtherDocument" ? "" : "using System;";
            if (mode == "alias") imports += "using Alias=System.String;";
            var extraMember = mode == "alias" ? "Alias Name=>\"\";" : mode == "warning" ? "int unused;" : "";
            var source = imports + "\nclass Clock{" + extraMember + "\n/// <summary><see cref=\"" + type + "\"/></summary>\nvoid M(global::System.DateTimeOffset value=default(DateTimeOffset)){} }";
            var extra = mode == "globalOtherDocument" ? "global using System;" : null;
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(type, StringComparison.Ordinal), type.Length), typeof(DateTimeOffset), TypeReferenceRole.WholeTypeCref);
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }), extra);
            var before = C5CompositionDiagnostics(source, extra);
            Assert.That(before.Any(static d => d.StartsWith("CS8019|", StringComparison.Ordinal)), Is.False);
            Assert.That(C5CompositionDiagnostics(output, extra), Is.EqualTo(before), "Retaining the cref must not expose an import removed by optional-default cleanup.");
        }

        [Test]
        public async Task StructuralC5HandlerRetentionAndOptionalDefaultKeepOriginalImportUse()
        {
            const string type = "global::System.DateTimeOffset";
            const string source = "using System;class Clock{static void M(global::System.DateTimeOffset value=default(DateTimeOffset)){}static void Capture(global::System.DateTimeOffset value,string text){}static void Entry()=>Capture(global::System.DateTimeOffset.Now,$\"{1}\");}";
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(type + ".Now", StringComparison.Ordinal), type.Length), typeof(DateTimeOffset));
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            var before = C5CompositionDiagnostics(source, null);
            Assert.That(before.Any(static d => d.StartsWith("CS8019|", StringComparison.Ordinal)), Is.False);
            Assert.That(C5CompositionDiagnostics(output, null), Is.EqualTo(before));
        }

        [TestCase("int")]
        [TestCase("string")]
        [TestCase("T")]
        [TestCase("global::System.DateTimeOffset")]
        [TestCase("global::System.String[]")]
        [TestCase("global::System.Collections.Generic.IEnumerable<global::System.DateTimeOffset>")]
        public async Task StructuralC5ImportIndependentOptionalDefaultStillReduces(string type)
        {
            var generic = type == "T" ? "<T>" : "";
            var source = "using Alias=System.String;class Clock{Alias Name=>\"\";void M" + generic + "(" + type + " value=default(" + type + ")){}}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value=default)", output);
        }

        [Test]
        public async Task StructuralC5RootedOuterDefaultWithImportedGenericArgumentRetainsImportUse()
        {
            const string type = "global::System.DateTimeOffset";
            const string source = "using System;using Alias=System.String;class Clock{Alias Name=>\"\";\n/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\nvoid M(global::System.Collections.Generic.IEnumerable<global::System.DateTimeOffset> value=default(global::System.Collections.Generic.IEnumerable<DateTimeOffset>)){} }";
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(type, StringComparison.Ordinal), type.Length), typeof(DateTimeOffset), TypeReferenceRole.WholeTypeCref);
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            Assert.That(C5CompositionDiagnostics(source, null).Any(static d => d.StartsWith("CS8019|", StringComparison.Ordinal)), Is.False);
            Assert.That(C5CompositionDiagnostics(output, null), Is.EqualTo(C5CompositionDiagnostics(source, null)));
            StringAssert.Contains("default(global::System.Collections.Generic.IEnumerable<DateTimeOffset>)", output);
        }

        [Test]
        public async Task StructuralC5RecordedDeclarationTypeIsNotAnUnchangedImportWitness()
        {
            const string type = "global::System.Collections.Generic.List";
            const string source = "using System;class Clock{void M(global::System.Collections.Generic.List<DateTimeOffset> value=default(global::System.Collections.Generic.List<DateTimeOffset>)){} }";
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(type, StringComparison.Ordinal), type.Length), typeof(System.Collections.Generic.List<DateTimeOffset>));
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            StringAssert.Contains("value=default(global::System.Collections.Generic.List<DateTimeOffset>)", output);
            Assert.That(C5CompositionDiagnostics(output, null), Is.EqualTo(C5CompositionDiagnostics(source, null)));
        }

        [Test]
        public async Task StructuralC5VetoedOptionalDefaultDoesNotExposeChildImportUse()
        {
            const string type = "global::System.Collections.Generic.List";
            const string source = "using System;\nusing System.Collections.Generic;\nclass Clock\n{\n    static void M(\n        global::System.Collections.Generic.List<global::System.DateTimeOffset> value =\n            default(global::System.Collections.Generic.List<DateTimeOffset>)) { }\n}";
            var site = new TypeReferenceSite(new TextSpan(source.LastIndexOf(type, StringComparison.Ordinal), type.Length), typeof(System.Collections.Generic.List<DateTimeOffset>));
            var before = C5CompositionDiagnostics(source, null);
            Assert.That(before.Count(static d => d.StartsWith("CS8019|", StringComparison.Ordinal)), Is.EqualTo(1));
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            Assert.That(C5CompositionDiagnostics(output, null), Is.EqualTo(before), "A newly vetoed whole-default erasure must not expose a child namespace rewrite that consumes an originally unused import.");
            StringAssert.Contains("default(global::System.Collections.Generic.List<DateTimeOffset>)", output);
        }

        [Test]
        public async Task StructuralC5OriginallyIneligibleDefaultKeepsIndependentChildReduction()
        {
            const string type = "global::System.Collections.Generic.List";
            const string source = "using System; using System.Collections.Generic; class Clock { public List<DateTimeOffset> Used=>null; static void M(object value=default(global::System.Collections.Generic.List<DateTimeOffset>)) {} }";
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(type, StringComparison.Ordinal), type.Length), typeof(System.Collections.Generic.List<DateTimeOffset>));
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            StringAssert.Contains("default(List<DateTimeOffset>)", output, "Original C2 ineligibility must not freeze independently supported child qualification changes.");
            Assert.That(C5CompositionDiagnostics(source, null), Is.Empty);
            Assert.That(C5CompositionDiagnostics(output, null), Is.Empty);
        }

        [TestCase(GeneratedKind.Unknown)]
        [TestCase(GeneratedKind.NotGenerated)]
        [TestCase(GeneratedKind.MarkedGenerated)]
        public void StructuralC5CrefDiagnosticViewPreservesGeneratedClassification(GeneratedKind kind)
        {
            var tree = CSharpSyntaxTree.ParseText("class Clock{string? Value=>null;}", new CSharpParseOptions(LanguageVersion.Preview));
            var provider = new C5GeneratedDiagnosticFilter(kind);
            var compilation = CSharpCompilation.Create("C5GeneratedFacts", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, nullableContextOptions: NullableContextOptions.Enable).WithSyntaxTreeOptionsProvider(provider));
            var diagnosticView = StructuralCrefImportRules.OriginalDiagnosticCompilation(compilation);
            var diagnosticProvider = diagnosticView.Options.SyntaxTreeOptionsProvider;
            Assert.That(diagnosticProvider, Is.Not.Null);
            Assert.That(diagnosticProvider!.IsGenerated(tree, CancellationToken.None), Is.EqualTo(kind));
            Assert.That(diagnosticProvider.TryGetDiagnosticValue(tree, "CS8019", CancellationToken.None, out _), Is.False);
            Assert.That(diagnosticProvider.TryGetGlobalDiagnosticValue("CS8019", CancellationToken.None, out _), Is.False);
            Assert.That(diagnosticView.SyntaxTrees.Single(), Is.SameAs(tree));
        }

        private static string[] C5CompositionDiagnostics(string source, string? extra)
        {
            var parse = new CSharpParseOptions(LanguageVersion.Preview, DocumentationMode.Diagnose);
            var tree = CSharpSyntaxTree.ParseText(source, parse, "Clock.cs");
            var trees = extra == null ? new[] { tree } : new[] { tree, CSharpSyntaxTree.ParseText(extra, parse, "Additional.cs") };
            var compilation = CSharpCompilation.Create("C5Composition", trees, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, reportSuppressedDiagnostics: true));
            return compilation.GetDiagnostics().Select(static d => d.Id + "|" + d.Severity + "|" + d.IsSuppressed + "|" + d.GetMessage()).OrderBy(static d => d, StringComparer.Ordinal).ToArray();
        }

        private sealed class C5GeneratedDiagnosticFilter(GeneratedKind kind) : SyntaxTreeOptionsProvider
        {
            public override GeneratedKind IsGenerated(SyntaxTree tree, CancellationToken cancellationToken) => kind;
            public override bool TryGetDiagnosticValue(SyntaxTree tree, string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = ReportDiagnostic.Suppress;
                return diagnosticId == "CS8019";
            }
            public override bool TryGetGlobalDiagnosticValue(string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = ReportDiagnostic.Suppress;
                return diagnosticId == "CS8019";
            }
        }
    }
}
