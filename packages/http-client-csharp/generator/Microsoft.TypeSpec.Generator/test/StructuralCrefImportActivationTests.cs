// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(0, true, TestName = "CrefImportActivation_NormalImportBecomesUsed")]
        [TestCase(1, true, TestName = "CrefImportActivation_UnrelatedHiddenImportPreserved")]
        [TestCase(2, false, TestName = "CrefImportActivation_GlobalImportRetained")]
        [TestCase(3, false, TestName = "CrefImportActivation_AliasImportRetained")]
        [TestCase(4, false, TestName = "CrefImportActivation_MissingProvenanceRetained")]
        [TestCase(5, false, TestName = "CrefImportActivation_OtherWarningRetained")]
        [TestCase(6, false, TestName = "CrefImportActivation_SameNamedMethodCannotStealCref")]
        [TestCase(7, true, TestName = "CrefImportActivation_MergedNamespaceUsesCompilationIdentity")]
        public async Task CrefImportActivationTrial(int scenario, bool shorten)
        {
            var directive = scenario == 2 ? "global using System;" : "using System;";
            if (scenario == 1)
            {
                directive += "\nusing System.Text;";
            }

            if (scenario == 3)
            {
                directive += "\nusing ExceptionAlias = System.ArgumentNullException;";
            }

            if (scenario == 5)
            {
                directive += "\n#warning keep this warning";
            }

            var source = directive + "\nnamespace Sample { class Clock {\n/// <exception cref=\"global::System.ArgumentNullException\"> Value is null. </exception>\nvoid M() {}\n" + (scenario == 6 ? "void ArgumentNullException() {}\n" : "") + "} }";
            if (scenario == 7)
            {
                source += "\nnamespace System { internal class NamespaceContributor {} }";
            }

            var code = RecordedCrefSource(source, typeof(ArgumentNullException));
            if (scenario == 7)
            {
                var tree = CSharpSyntaxTree.ParseText(code.Content, new CSharpParseOptions(documentationMode: DocumentationMode.Parse));
                var compilation = CSharpCompilation.Create("MergedNamespaceCref", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                var imported = compilation.GetSemanticModel(tree).GetSymbolInfo(((CompilationUnitSyntax)tree.GetRoot()).Usings.Single().Name!).Symbol;
                var target = compilation.GetTypeByMetadataName("System.ArgumentNullException")!;
                Assert.That(SymbolEqualityComparer.Default.Equals(imported, target.ContainingNamespace), Is.False, "A constituent namespace is not the merged compilation namespace");
                Assert.That(SymbolEqualityComparer.Default.Equals(imported, compilation.GetCompilationNamespace(target.ContainingNamespace)), Is.True, "Compiler-backed canonical namespace identity");
            }
            if (scenario == 4)
            {
                code = new CodeFile(code.Content, code.Name);
            }

            var output = await Reduce(code);
            AssertStructuralCrefs(code.Content, output);
            AssertExpectedCrefImportActivation(code.Content, output, shorten);
            StringAssert.Contains("cref=\"" + (shorten ? "ArgumentNullException" : "global::System.ArgumentNullException") + "\"", output);
        }

        [Test]
        public void ExceptionCrefWriterRecordsWholeTypeProvenance()
        {
            var code = ExceptionImportActivationCode();
            var tree = CSharpSyntaxTree.ParseText(code.Content, new CSharpParseOptions(documentationMode: DocumentationMode.Parse));
            var cref = tree.GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>().Single().Cref;
            Assert.That(cref.ToString(), Is.EqualTo("global::System.ArgumentNullException"), "Producer text remains qualified");
            var site = code.TypeReferences!.Single(s => s.Span == cref.Span);
            Assert.That(site.Role, Is.EqualTo(TypeReferenceRole.WholeTypeCref));
            Assert.That(site.Type.FrameworkType, Is.EqualTo(typeof(ArgumentNullException)));
        }

        [Test]
        public async Task ExceptionCrefActualWriterImportActivation()
        {
            var code = ExceptionImportActivationCode(); var output = await Reduce(code);
            AssertStructuralCrefs(code.Content, output); AssertExpectedCrefImportActivation(code.Content, output, true);
            StringAssert.Contains("cref=\"ArgumentNullException\"", output);
        }

        private static CodeFile ExceptionImportActivationCode() => Recorded(writer =>
        {
            writer.WriteRawLine("namespace Sample { class Clock {");
            new XmlDocExceptionStatement(typeof(ArgumentNullException), Array.Empty<ParameterProvider>()).Write(writer);
            writer.WriteRawLine("void M() {} } }");
        });

        [TestCase(ReportDiagnostic.Warn, false)]
        [TestCase(ReportDiagnostic.Error, false)]
        [TestCase(ReportDiagnostic.Suppress, false)]
        [TestCase(ReportDiagnostic.Warn, true)]
        [TestCase(ReportDiagnostic.Error, true)]
        [TestCase(ReportDiagnostic.Suppress, true)]
        public void CrefImportActivationCustomSeverityRetains(ReportDiagnostic severity, bool treeProvider)
        {
            var code = RecordedCrefSource("using System;\nclass Clock {\n/// <see cref=\"global::System.ArgumentNullException\"/>\nvoid M(){} }", typeof(ArgumentNullException));
            var tree = CSharpSyntaxTree.ParseText(code.Content, new CSharpParseOptions(documentationMode: DocumentationMode.Parse));
            var options = new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, reportSuppressedDiagnostics: true);
            options = treeProvider ? options.WithSyntaxTreeOptionsProvider(new CrefActivationSeverityProvider(severity)) : options.WithSpecificDiagnosticOptions(new Dictionary<string, ReportDiagnostic> { ["CS8019"] = severity });
            var compilation = CSharpCompilation.Create("CrefImportSeverity", new[] { tree }, References, options);
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), code.TypeReferences!)!;
            StringAssert.Contains("cref=\"global::System.ArgumentNullException\"", rewriter.Visit(tree.GetRoot())!.ToFullString());
        }

        private sealed class CrefActivationSeverityProvider(ReportDiagnostic severity) : SyntaxTreeOptionsProvider
        {
            public override GeneratedKind IsGenerated(SyntaxTree tree, CancellationToken cancellationToken) => GeneratedKind.Unknown;
            public override bool TryGetDiagnosticValue(SyntaxTree tree, string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic value) { value = severity; return diagnosticId == "CS8019"; }
            public override bool TryGetGlobalDiagnosticValue(string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic value) { value = ReportDiagnostic.Default; return false; }
        }

        private static void AssertExpectedCrefImportActivation(string before, string after, bool expectActivation)
        {
            const string prefix = "global::System.";
            var edits = new List<TextSpan>(); int a = 0, b = 0;
            while (a < before.Length || b < after.Length)
            {
                if (a < before.Length && b < after.Length && before[a] == after[b]) { a++; b++; continue; }
                Assert.That(before.AsSpan(a).StartsWith(prefix + "ArgumentNullException", StringComparison.Ordinal), Is.True);
                edits.Add(new TextSpan(a, prefix.Length)); a += prefix.Length;
            }
            var options = new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose);
            var oldTree = CSharpSyntaxTree.ParseText(before, options, path: "CrefImportActivation.cs"); var nextTree = CSharpSyntaxTree.ParseText(after, options, path: oldTree.FilePath);
            var old = CSharpCompilation.Create("CrefImportActivationDiagnostics", new[] { oldTree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)); var next = old.ReplaceSyntaxTree(oldTree, nextTree);
            var targetImport = ((CompilationUnitSyntax)oldTree.GetRoot()).Usings.First(u => u.Name!.ToString() == "System");
            var originalHidden = old.GetDiagnostics().Where(d => d.Id == "CS8019" && d.Severity == DiagnosticSeverity.Hidden && d.Location.SourceSpan == targetImport.Span).ToArray();
            Assert.That(originalHidden.Length, Is.EqualTo(1), "Original normal import is actually unused");
            // An expected removal is allowed only after an ACTUAL namespace deletion;
            // baseline tests still reach the spelling assertion while old rules retain.
            bool activated = expectActivation && edits.Count != 0;
            int Project(int position) { Assert.That(edits.Any(e => e.Start < position && position < e.End), Is.False); return position - edits.Where(e => e.End <= position).Sum(e => e.Length); }
            object Location(Location location, bool project)
            {
                if (!location.IsInSource)
                {
                    return new { kind = location.Kind.ToString() };
                }

                var span = location.SourceSpan; if (project) { Assert.That(edits.Any(e => e.IntersectsWith(span)), Is.False); span = TextSpan.FromBounds(Project(span.Start), Project(span.End)); }
                var physical = nextTree.GetLineSpan(span); var mapped = nextTree.GetMappedLineSpan(span);
                return new { physical.Path, Start = span.Start, End = span.End, physicalStart = physical.StartLinePosition.ToString(), physicalEnd = physical.EndLinePosition.ToString(), mappedPath = mapped.Path, mappedStart = mapped.StartLinePosition.ToString(), mappedEnd = mapped.EndLinePosition.ToString() };
            }
            bool ExpectedRemoval(Diagnostic d) => activated && d.Id == "CS8019" && d.Severity == DiagnosticSeverity.Hidden && d.DefaultSeverity == DiagnosticSeverity.Hidden && !d.IsSuppressed && d.Location.SourceSpan == targetImport.Span;
            string[] Bag(IEnumerable<Diagnostic> diagnostics, bool project) => diagnostics.Where(d => !project || !ExpectedRemoval(d)).Select(d => System.Text.Json.JsonSerializer.Serialize(new
            {
                d.Id, severity = d.Severity.ToString(), defaultSeverity = d.DefaultSeverity.ToString(), d.IsSuppressed, d.WarningLevel, message = d.GetMessage(),
                descriptor = new { d.Descriptor.Id, title = d.Descriptor.Title.ToString(), message = d.Descriptor.MessageFormat.ToString(), d.Descriptor.Category, d.Descriptor.IsEnabledByDefault, description = d.Descriptor.Description.ToString(), d.Descriptor.HelpLinkUri, tags = d.Descriptor.CustomTags.ToArray() },
                properties = d.Properties.OrderBy(p => p.Key, StringComparer.Ordinal).ToArray(), location = Location(d.Location, project), additional = d.AdditionalLocations.Select(l => Location(l, project)).ToArray()
            })).OrderBy(x => x, StringComparer.Ordinal).ToArray();
            if (activated)
            {
                Assert.That(next.GetDiagnostics().Any(d => d.Id == "CS8019" && d.Location.SourceSpan == targetImport.Span), Is.False, "Approved shortening genuinely uses the existing import");
            }

            Assert.That(Bag(next.GetDiagnostics(), false), Is.EqualTo(Bag(old.GetDiagnostics(), true)), "All diagnostic fields and locations preserved except the one explicitly activated Hidden import");
            using var oldPe = new MemoryStream(); using var newPe = new MemoryStream(); using var oldXml = new MemoryStream(); using var newXml = new MemoryStream();
            var oldEmit = old.Emit(oldPe, xmlDocumentationStream: oldXml); var newEmit = next.Emit(newPe, xmlDocumentationStream: newXml);
            Assert.That(newEmit.Success, Is.EqualTo(oldEmit.Success)); Assert.That(Bag(newEmit.Diagnostics, false), Is.EqualTo(Bag(oldEmit.Diagnostics, true)));
            if (oldEmit.Success)
            {
                Assert.That(newXml.ToArray(), Is.EqualTo(oldXml.ToArray()), "Whole XML/documentation identity preserved");
            }
        }
    }
}
