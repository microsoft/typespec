// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(0, false, TestName = "BranchStatic_DirectiveBearingReceiverRetained")]
        [TestCase(1, true, TestName = "BranchStatic_NestedUsingAndWriteCalls")]
        [TestCase(2, true, TestName = "BranchStatic_ReturnedFallbackCall")]
        [TestCase(3, false, TestName = "BranchStatic_InactiveOverloadCallerSourceCaptureRetainsOriginal")]
        [TestCase(4, false, TestName = "BranchStatic_ClosureAppearsOnlyInInactiveParseRetainsOriginal")]
        [TestCase(5, false, TestName = "BranchStatic_LocalFunctionRetained")]
        [TestCase(6, false, TestName = "BranchStatic_OuterArgumentRetained")]
        [TestCase(7, false, TestName = "BranchStatic_OuterConstructorCaptureRetained")]
        [TestCase(8, false, TestName = "BranchStatic_InterpolationRetained")]
        [TestCase(9, false, TestName = "BranchStatic_HiddenActiveSourceRetained")]
        [TestCase(10, false, TestName = "BranchStatic_MissingProvenanceRetained")]
        [TestCase(11, false, TestName = "BranchStatic_DefineDirectiveRetained")]
        [TestCase(12, false, TestName = "BranchStatic_ConditionalHeaderRetained")]
        [TestCase(13, false, TestName = "BranchStatic_ShadowChangesBetweenActiveParsesRetained")]
        [TestCase(14, false, TestName = "BranchStatic_HiddenInactiveSourceRetained")]
        [TestCase(15, false, TestName = "BranchStatic_InternalCommentRetained")]
        [TestCase(16, true, TestName = "BranchStatic_DirectAssignedFallbackCall")]
        public async Task BranchStaticReceiverTrial(int scenario, bool shorten)
        {
            var code = BranchStaticCode(scenario);
            if (scenario is 3 or 4)
            {
                AssertInactiveBranchCaptureRegression(code.Content, scenario);
            }

            string output;
            if (scenario == 13)
            {
                // Preserve an original noncanonical framework state. The original
                // active branch has no shadow; another active parse introduces it.
                var parse = new CSharpParseOptions(preprocessorSymbols: new[] { "NET8_0_OR_GREATER" });
                var tree = CSharpSyntaxTree.ParseText(code.Content, parse, code.Name);
                var compilation = CSharpCompilation.Create("BranchActiveShadow", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                var root = tree.GetRoot();
                Assert.That(compilation.GetSemanticModel(tree).GetSymbolInfo(root.DescendantNodes().OfType<InvocationExpressionSyntax>().Single(c => c.Expression.ToString() == "global::Sample.Utility.Go")).Symbol, Is.Not.Null);
                var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(root, code.TypeReferences!)!;
                output = rewriter.Visit(root)!.ToFullString();
                AssertParenthesesOperations(code.Content, output, parseOptions: parse);
            }
            else
            {
                output = await Reduce(code);
            }

            AssertConditionalParenthesesOperations(code.Content, output);
            AssertParenthesesOperations(code.Content, output, parseOptions: new CSharpParseOptions(preprocessorSymbols: new[] { "EXPERIMENTAL", "NET8_0_OR_GREATER" }));
            AssertBranchStaticDiagnostics(code.Content, output);
            Assert.That(output.Contains("global::Sample.", StringComparison.Ordinal), Is.EqualTo(!shorten));
        }

        [Test]
        public void BranchStaticDirectiveBoundaryTrace()
        {
            var code = BranchStaticCode(0); var tree = CSharpSyntaxTree.ParseText(code.Content); var root = tree.GetRoot();
            var compilation = CSharpCompilation.Create("BranchDirectiveTrace", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var receiver = root.DescendantNodes().OfType<MemberAccessExpressionSyntax>().Single(n => n.ToString() == "global::Sample.Utility");
            var member = (MemberAccessExpressionSyntax)receiver.Parent!;
            var unit = ConditionalStaticReceiverRules.OuterExecutableUnit(receiver)!;
            var conditional = new ProviderConditionalSyntax(compilation);
            Assert.That(conditional.TryGetRoots(root, out var roots), Is.True);
            Assert.That(ConditionalStaticReceiverRules.CanProveBranchLocalMethod(receiver, member, unit, roots, receiver.Span), Is.True, "Branch source certificate is not the rejecting guard");
            var source = StructuralTypeNameSelector.Describe(receiver, preserveBoundaryComments: true);
            TestContext.Progress.WriteLine("Direct-call boundary: branchCertificate=true; ContainsDirectives=" + receiver.ContainsDirectives + "; source.Directives=" + source.Directives);
            Assert.That(source.Directives, Is.True, "Existing DescribeRecordedReference rejects directive-bearing receiver trivia before selection");
            Assert.That(receiver.ContainsDirectives, Is.True);
        }

        [TestCase(0, true)]
        [TestCase(3, false)]
        [TestCase(4, false)]
        public void BranchStaticDisabledSourceCertificate(int scenario, bool safe)
        {
            var code = BranchStaticCode(scenario);
            var original = CSharpSyntaxTree.ParseText(code.Content).GetRoot();
            var call = original.DescendantNodes().OfType<InvocationExpressionSyntax>().Single(c => c.Expression.ToString() == "global::Sample.Utility.Go");
            var receiver = ((MemberAccessExpressionSyntax)call.Expression).Expression;
            var inactive = CSharpSyntaxTree.ParseText(code.Content, new CSharpParseOptions(preprocessorSymbols: new[] { "NET6_0_OR_GREATER" })).GetRoot();
            Assert.That(inactive.DescendantTrivia().Any(t => t.IsKind(SyntaxKind.DisabledTextTrivia) && t.Span.Contains(call.Span)), Is.True);
            if (scenario == 4)
            {
                Assert.That(receiver.Ancestors().OfType<AnonymousFunctionExpressionSyntax>(), Is.Empty, "Closure exists only in the inactive parse, not the original source context");
            }

            Assert.That(ConditionalStaticReceiverRules.HasUnobservedDisabledCall(call, inactive, receiver.Span), Is.EqualTo(safe), "Directly test the inactive-source certificate independently of earlier header/shape vetoes");
        }

        private static CodeFile BranchStaticCode(int scenario)
        {
            const string actionVsFunc = """
public string Run() => Capture(() => {
#if NET6_0_OR_GREATER
            return 1;
#else
            global::Sample.Utility.Go();
#endif
        });
""";
            const string inactiveOnlyClosure = """
public void M() {
#if NET6_0_OR_GREATER
    Source = Capture(() => {
#endif
#if NET6_0_OR_GREATER
        return 1;
#else
        global::Sample.Utility.Go();
#endif
#if NET6_0_OR_GREATER
    });
#endif
}
""";
            string call = scenario switch
            {
                1 => "foreach (var value in new[] { 1 }) { using (MemoryStream stream = global::Sample.Utility.Open()) { global::Sample.Utility.Write(stream); } }",
                2 => "return global::Sample.Utility.Abs(1);",
                6 => "Consume(global::Sample.Utility.Abs(1));",
                7 => "new Observer(global::Sample.Utility.Abs(1));",
                8 => "Source = $\"{(global::Sample.Utility.Abs(1))}\";",
                15 => "global::Sample./*keep*/Utility.Go();",
                16 => "Sink = global::Sample.Utility.Abs(1);",
                _ => "global::Sample.Utility.Go();"
            };
            string method = scenario == 3 ? actionVsFunc : scenario == 4 ? inactiveOnlyClosure :
                (scenario == 2 ? "public int M() {\n" : "public void M() {\n") +
                (scenario == 5 ? "void Local() {\n" : "") +
                (scenario == 13 ? "#if NET8_0_OR_GREATER\n#else\nvar Utility = new Shadow();\n#endif\n" : "") +
                (scenario == 9 ? "#line hidden\n" : "") +
                "#if NET6_0_OR_GREATER\n" + (scenario == 14 ? "#line hidden\n" : "") +
                (scenario == 2 ? "return 2;\n" : "Sink = 1;\n") + "#else\n" + call + "\n#endif\n" +
                (scenario is 9 or 14 ? "#line default\n" : "") +
                (scenario == 5 ? "}\nLocal();\n" : "") + "}\n";
            var source = (scenario == 11 ? "#define EXTRA\n" : "") + """
using System;
using System.IO;
using System.Runtime.CompilerServices;
namespace Sample {
    internal static class Utility {
        public static void Go() {}
        public static int Abs(int value) => value;
        public static MemoryStream Open() => new MemoryStream();
        public static void Write(Stream stream) {}
    }
    internal class Shadow { public void Go() {} }
    internal class Observer { public Observer(int value, [CallerArgumentExpression("value")] string source = null) {} }
    public class Clock {
        public int Sink;
        public string Source;
        static int Consume(int value) => value;
        static string Capture(Action action) => "Action overload";
        static string Capture(Func<int> action, [CallerArgumentExpression("action")] string source = null) => source;
""" + "\n" + (scenario == 12 ? "#if NET6_0_OR_GREATER\npublic void ConditionalMember() {}\n#endif\n" : "") + method + "} }";
            var type = new CSharpType("Utility", "Sample", false, false, null, Array.Empty<CSharpType>(), false, false);
            var sites = Regex.Matches(source, @"global::Sample\.(?:/\*keep\*/)?Utility").Cast<Match>().Select(m => new TypeReferenceSite(new TextSpan(m.Index, m.Length), type)).ToArray();
            return new CodeFile(source, "Clock.cs", scenario == 10 ? Array.Empty<TypeReferenceSite>() : sites);
        }

        private static void AssertInactiveBranchCaptureRegression(string source, int scenario)
        {
            // Preserve the read-only compiler witness: an unsafe forced namespace
            // deletion changes NET6's ACTUAL implicit CAE string despite zero
            // active Utility calls. With scenario4 the original parse has no
            // enclosing closure at all, so inactive-parse inspection is essential.
            var forced = source.Replace("global::Sample.Utility.Go()", "Utility.Go()", StringComparison.Ordinal);
            foreach (var net6 in new[] { false, true })
            {
                string? previousMethod = null, capturedBefore = null, capturedAfter = null;
                foreach (var text in new[] { source, forced })
                {
                    var tree = CSharpSyntaxTree.ParseText(text, new CSharpParseOptions(preprocessorSymbols: net6 ? new[] { "NET6_0_OR_GREATER" } : Array.Empty<string>()));
                    var compilation = CSharpCompilation.Create("InactiveBranchRegression", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                    Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                    var calls = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Where(c => c.Expression.ToString() == "Capture").ToArray();
                    if (!net6 && scenario == 4) { Assert.That(calls, Is.Empty); continue; }
                    var call = calls.Single(); var operation = (IInvocationOperation)compilation.GetSemanticModel(tree).GetOperation(call)!;
                    Assert.That(operation.TargetMethod.Parameters[0].Type.Name, Is.EqualTo(net6 ? "Func" : "Action"));
                    var signature = operation.TargetMethod.ToDisplayString(SymbolDisplayFormat.CSharpErrorMessageFormat);
                    if (previousMethod != null)
                    {
                        Assert.That(signature, Is.EqualTo(previousMethod));
                    }

                    previousMethod = signature;
                    var argument = operation.Arguments.SingleOrDefault(a => a.Parameter?.Name == "source");
                    string? captured = argument?.Value.ConstantValue.Value as string;
                    if (text == source)
                    {
                        capturedBefore = captured;
                    }
                    else
                    {
                        capturedAfter = captured;
                    }

                    using var pe = new MemoryStream(); Assert.That(compilation.Emit(pe).Success, Is.True);
                    if (net6)
                    {
                        Assert.That(tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Any(c => c.Expression.ToString().EndsWith("Utility.Go", StringComparison.Ordinal)), Is.False);
                    }
                    else
                    {
                        Assert.That(argument, Is.Null);
                    }
                }
                if (net6)
                {
                    Assert.That(capturedBefore, Does.Contain("global::Sample.Utility.Go()"));
                    Assert.That(capturedAfter, Is.EqualTo(capturedBefore!.Replace("global::Sample.Utility.Go()", "Utility.Go()", StringComparison.Ordinal)));
                    Assert.That(capturedAfter, Is.Not.EqualTo(capturedBefore));
                }
            }
        }

        private static void AssertBranchStaticDiagnostics(string before, string after)
        {
            const string prefix = "global::Sample.";
            var edits = new List<TextSpan>(); int a = 0, b = 0;
            while (a < before.Length || b < after.Length)
            {
                if (a < before.Length && b < after.Length && before[a] == after[b]) { a++; b++; continue; }
                Assert.That(before.AsSpan(a).StartsWith(prefix + "Utility.", StringComparison.Ordinal), Is.True, "Only recorded Utility prefix may change");
                edits.Add(new TextSpan(a, prefix.Length)); a += prefix.Length;
            }
            foreach (var symbols in new[] { Array.Empty<string>(), new[] { "NET6_0_OR_GREATER" }, new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER" },
                new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER" }, new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER", "NET10_0_OR_GREATER" }, new[] { "NET8_0_OR_GREATER" } })
            {
                var parse = new CSharpParseOptions(preprocessorSymbols: symbols.Prepend("EXPERIMENTAL"));
                var oldTree = CSharpSyntaxTree.ParseText(before, parse, "BranchStatic.cs"); var nextTree = CSharpSyntaxTree.ParseText(after, parse, oldTree.FilePath);
                var old = CSharpCompilation.Create("BranchStaticDiagnostics", new[] { oldTree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)); var next = old.ReplaceSyntaxTree(oldTree, nextTree);
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
                string[] Bag(IEnumerable<Diagnostic> diagnostics, bool project) => diagnostics.Select(d => System.Text.Json.JsonSerializer.Serialize(new
                {
                    d.Id, severity = d.Severity.ToString(), defaultSeverity = d.DefaultSeverity.ToString(), d.IsSuppressed, d.IsWarningAsError, d.WarningLevel, message = d.GetMessage(),
                    descriptor = new { d.Descriptor.Id, title = d.Descriptor.Title.ToString(), message = d.Descriptor.MessageFormat.ToString(), d.Descriptor.Category, d.Descriptor.IsEnabledByDefault, description = d.Descriptor.Description.ToString(), d.Descriptor.HelpLinkUri, tags = d.Descriptor.CustomTags.ToArray() },
                    properties = d.Properties.OrderBy(p => p.Key, StringComparer.Ordinal).ToArray(), location = Location(d.Location, project), additional = d.AdditionalLocations.Select(l => Location(l, project)).ToArray()
                })).OrderBy(x => x, StringComparer.Ordinal).ToArray();
                Assert.That(Bag(next.GetDiagnostics(), false), Is.EqualTo(Bag(old.GetDiagnostics(), true)), "Complete compiler diagnostic multiset, including Hidden/Info and every endpoint");
                using var oldPe = new MemoryStream(); using var nextPe = new MemoryStream(); var oldEmit = old.Emit(oldPe); var nextEmit = next.Emit(nextPe);
                Assert.That(nextEmit.Success, Is.EqualTo(oldEmit.Success)); Assert.That(Bag(nextEmit.Diagnostics, false), Is.EqualTo(Bag(oldEmit.Diagnostics, true)));
            }
        }
    }
}
