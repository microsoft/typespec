// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(0, true, TestName = "OptionalAncestor_DottedModelsNamespace")]
        [TestCase(1, true, TestName = "OptionalAncestor_ExplicitNestedNamespace")]
        [TestCase(2, true, TestName = "OptionalAncestor_MultipleAncestorLevels")]
        [TestCase(3, false, TestName = "OptionalAncestor_LocalImportMustKeepHiddenDiagnostic")]
        [TestCase(4, false, TestName = "OptionalAncestor_SameTargetAliasRetained")]
        [TestCase(5, false, TestName = "OptionalAncestor_UnrelatedLocalImportConservativelyRetained")]
        [TestCase(6, false, TestName = "OptionalAncestor_ConditionalOuterShadowRetained")]
        [TestCase(7, false, TestName = "OptionalAncestor_CallerSourceRetained")]
        [TestCase(8, false, TestName = "OptionalAncestor_ForeignNamespaceNotAncestor")]
        [TestCase(9, false, TestName = "OptionalAncestor_InterveningOuterNamespaceImport")]
        public async Task OptionalAncestorScopeTrial(int scenario, bool shorten)
        {
            var targetNamespace = scenario == 8 ? "Foreign" : "Sample";
            var target = new CSharpType("Optional", targetNamespace, false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices;");
                writer.WriteRawLine($"namespace {targetNamespace} {{ internal static class Optional {{ public static bool IsDefined(object value) => value != null; }} }}");
                if (scenario == 1) writer.WriteRawLine("namespace Sample { namespace Models {");
                else if (scenario == 9) writer.WriteRawLine("namespace Sample.Models { using Sample; namespace Child {");
                else writer.WriteRawLine("namespace " + (scenario == 2 ? "Sample.Models.Child" : "Sample.Models") + " {");
                if (scenario == 3) writer.WriteRawLine("using Sample;");
                if (scenario == 4) writer.WriteRawLine("using Optional = global::Sample.Optional;");
                if (scenario == 5) writer.WriteRawLine("using System.Text;");
                writer.WriteRawLine("public class Probe { public object Properties { get; set; } public int Sink { get; set; }");
                writer.WriteRawLine("static bool Capture(bool value, [CallerArgumentExpression(\"value\")] string text = null) => value;");
                writer.WriteRawLine("public void Write() {");
                if (scenario == 6) writer.WriteRawLine("#if NET6_0_OR_GREATER\nobject Optional = null;\n#endif");
                if (scenario == 7) writer.WriteLine($"if (Capture({target}.IsDefined(Properties)))");
                else writer.WriteLine($"if ({target}.IsDefined(Properties))");
                writer.WriteRawLine("{ Sink = 1; } if (Properties != null) { foreach (var item in new[] { 1 }) {\n#if NET6_0_OR_GREATER\nSink = item;\n#else\nusing (var document = new System.IO.MemoryStream()) { Sink = (int)document.Length; }\n#endif\n} } } } }");
                if (scenario is 1 or 9) writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            AssertConditionalParenthesesOperations(code.Content, output);
            AssertOptionalAncestorDiagnostics(code.Content, output, scenario is 3 or 9);
            StringAssert.Contains(shorten ? "if (Optional.IsDefined(Properties))" : $"global::{targetNamespace}.Optional.", output);
        }

        private static void AssertOptionalAncestorDiagnostics(string before, string after, bool requireUnusedLocalImport)
        {
            const string prefix = "global::Sample.";
            var edits = new List<TextSpan>();
            int a = 0, b = 0;
            while (a < before.Length || b < after.Length)
            {
                if (a < before.Length && b < after.Length && before[a] == after[b]) { a++; b++; continue; }
                Assert.That(before.AsSpan(a).StartsWith(prefix + "Optional.IsDefined", StringComparison.Ordinal), Is.True, "Only recorded Optional prefix may change");
                edits.Add(new TextSpan(a, prefix.Length)); a += prefix.Length;
            }
            foreach (var symbols in new[] { Array.Empty<string>(), new[] { "NET6_0_OR_GREATER" }, new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER" },
                new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER" }, new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER", "NET10_0_OR_GREATER" } })
            {
                var options = new CSharpParseOptions(preprocessorSymbols: symbols.Prepend("EXPERIMENTAL"));
                var oldTree = CSharpSyntaxTree.ParseText(before, options, path: "OptionalAncestor.cs");
                var nextTree = CSharpSyntaxTree.ParseText(after, options, path: oldTree.FilePath);
                var old = CSharpCompilation.Create("OptionalAncestorDiagnostics", new[] { oldTree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                var next = old.ReplaceSyntaxTree(oldTree, nextTree);
                if (requireUnusedLocalImport)
                {
                    var import = oldTree.GetRoot().DescendantNodes().OfType<UsingDirectiveSyntax>().Single(u => u.Parent is BaseNamespaceDeclarationSyntax && u.Name!.ToString() == "Sample");
                    Assert.That(old.GetDiagnostics().Any(d => d.Id == "CS8019" && d.Severity == DiagnosticSeverity.Hidden && d.Location.SourceSpan == import.Span), Is.True, "Original local namespace import must genuinely be unused");
                }
                int Project(int position) { Assert.That(edits.Any(e => e.Start < position && position < e.End), Is.False); return position - edits.Where(e => e.End <= position).Sum(e => e.Length); }
                object Location(Location location, bool project)
                {
                    if (!location.IsInSource) return new { kind = location.Kind.ToString() };
                    var span = location.SourceSpan; if (project) { Assert.That(edits.Any(e => e.IntersectsWith(span)), Is.False); span = TextSpan.FromBounds(Project(span.Start), Project(span.End)); }
                    var physical = nextTree.GetLineSpan(span); var mapped = nextTree.GetMappedLineSpan(span);
                    return new { physical.Path, Start = span.Start, End = span.End, physicalStart = physical.StartLinePosition.ToString(), physicalEnd = physical.EndLinePosition.ToString(), mappedPath = mapped.Path, mappedStart = mapped.StartLinePosition.ToString(), mappedEnd = mapped.EndLinePosition.ToString() };
                }
                string[] Bag(IEnumerable<Diagnostic> diagnostics, bool project) => diagnostics.Select(d => System.Text.Json.JsonSerializer.Serialize(new
                {
                    d.Id, severity = d.Severity.ToString(), defaultSeverity = d.DefaultSeverity.ToString(), d.IsSuppressed, d.WarningLevel, message = d.GetMessage(),
                    descriptor = new { d.Descriptor.Id, title = d.Descriptor.Title.ToString(), message = d.Descriptor.MessageFormat.ToString(), d.Descriptor.Category, d.Descriptor.IsEnabledByDefault, description = d.Descriptor.Description.ToString(), d.Descriptor.HelpLinkUri, tags = d.Descriptor.CustomTags.ToArray() },
                    properties = d.Properties.OrderBy(p => p.Key, StringComparer.Ordinal).ToArray(), location = Location(d.Location, project), additional = d.AdditionalLocations.Select(l => Location(l, project)).ToArray()
                })).OrderBy(x => x, StringComparer.Ordinal).ToArray();
                Assert.That(Bag(next.GetDiagnostics(), false), Is.EqualTo(Bag(old.GetDiagnostics(), true)), "Complete compiler diagnostic multiset including Hidden/Info and every location endpoint");
                using var oldPe = new MemoryStream(); using var newPe = new MemoryStream();
                var oldEmit = old.Emit(oldPe); var newEmit = next.Emit(newPe);
                Assert.That(newEmit.Success, Is.EqualTo(oldEmit.Success));
                Assert.That(Bag(newEmit.Diagnostics, false), Is.EqualTo(Bag(oldEmit.Diagnostics, true)), "Complete emit diagnostic multiset");
            }
        }
    }
}
