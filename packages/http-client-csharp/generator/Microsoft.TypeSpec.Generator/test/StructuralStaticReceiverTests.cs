// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("field")]
        [TestCase("property")]
        [TestCase("method")]
        [TestCase("genericReceiver")]
        [TestCase("methodGroup")]
        [TestCase("explicitMethodArguments")]
        public async Task StaticReceiverQualifierPreservesTheCompleteMemberAndCall(string kind)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                switch (kind)
                {
                    case "field": writer.WriteLine($"public object M() => {typeof(Guid)}.Empty;"); break;
                    case "property": writer.WriteLine($"public object M() => {typeof(DateTimeOffset)}.Now;"); break;
                    case "method": writer.WriteLine($"public string M() => {typeof(Convert)}.ToString(42);"); break;
                    case "genericReceiver": writer.WriteLine($"public int M() => {typeof(Comparer<int>)}.Default.Compare(1, 2);"); break;
                    case "methodGroup": writer.WriteLine($"public System.Func<int, string> M() => {typeof(Convert)}.ToString;"); break;
                    default: writer.WriteLine($"public object M() => {typeof(Array)}.Empty<int>();"); break;
                }
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            var expected = kind switch
            {
                "field" => "Guid.Empty", "property" => "DateTimeOffset.Now", "method" => "Convert.ToString(42)",
                "genericReceiver" => "Comparer<int>.Default.Compare(1, 2)", "methodGroup" => "Convert.ToString;", _ => "Array.Empty<int>()"
            };
            StringAssert.Contains(expected, output);
            StringAssert.DoesNotContain("global::", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [Test]
        public async Task StaticReceiverMissingMetadataRemainsQualified()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public object M() => {typeof(Enumerable)}.Empty<int>();");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.Linq.Enumerable.Empty<int>()", output);
            Assert.That(Count(GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary(), "StructuralStaticReceivers.MetadataRejected"), Is.EqualTo(1));
            AssertStaticMemberBindings(code.Content, output);
        }

        [Test]
        public async Task StaticReceiverNamespaceAliasRetainsTheFullMember()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using S = System; namespace Sample { public class Clock { public class System {} public class Convert {}");
                writer.WriteLine($"public string M() => {typeof(Convert)}.ToString(42);");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("S::Convert.ToString(42)", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [Test]
        public async Task StaticReceiverDecisionsDoNotLeakAcrossNestedValueScopes()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"object first = {typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("{ object DateTimeOffset = 0; object System = 0;");
                writer.WriteLine($"object blocked = {typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("}");
                writer.WriteLine($"object last = {typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("return last; } } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("first = DateTimeOffset.Now", output);
            StringAssert.Contains("blocked = global::System.DateTimeOffset.Now", output);
            StringAssert.Contains("last = DateTimeOffset.Now", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [TestCase("parameter")]
        [TestCase("lambda")]
        [TestCase("query")]
        public async Task StaticReceiverRejectsCompetingValuesAtTheActualPosition(string kind)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Linq; namespace Sample { public class Clock {");
                if (kind == "parameter") writer.WriteRawLine("public object M(object DateTimeOffset, object System) =>");
                else if (kind == "lambda") writer.WriteRawLine("public System.Func<object, object> M(object System) => DateTimeOffset =>");
                else writer.WriteRawLine("public object M(object System) => from DateTimeOffset in new[] { 1 } select");
                writer.WriteLine($"{typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.DateTimeOffset.Now", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StaticReceiverObservesOmittedCapturedSourceAndExplicitOverrides(bool explicitText)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Clock {");
                if (explicitText) writer.WriteLine($"public object M() => Capture({typeof(DateTimeOffset)}.Now, \"manual\");");
                else writer.WriteLine($"public object M() => Capture({typeof(DateTimeOffset)}.Now);");
                writer.WriteRawLine("private object Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains(explicitText ? "Capture(DateTimeOffset.Now, \"manual\")" : "Capture(global::System.DateTimeOffset.Now)", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [Test]
        public async Task ConditionalStaticReceiverProofDoesNotAuthorizeDynamicCallsOrNameof()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public string Name() => nameof({typeof(DateTimeOffset)}.Now);");
                writer.WriteLine($"public object Dynamic(dynamic value) => {typeof(Convert)}.ToString(value);");
                writer.WriteLine($"public object Ordinary() => {typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("public int Conditional() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 0;\n#endif\n} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("nameof(global::System.DateTimeOffset.Now)", output);
            StringAssert.Contains("global::System.Convert.ToString(value)", output);
            StringAssert.Contains("Ordinary() => DateTimeOffset.Now", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        private static void AssertStaticMemberBindings(string before, string after)
        {
            string[] Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source);
                var compilation = CSharpCompilation.Create("StaticReceiverOracle", new[] { tree }, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var result = new List<string>();
                foreach (var access in tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>())
                {
                    var symbol = model.GetSymbolInfo(access).Symbol;
                    if (symbol is not (IMethodSymbol or IFieldSymbol or IPropertySymbol or IEventSymbol) || !symbol.IsStatic) continue;
                    var methodArguments = symbol is IMethodSymbol method ? string.Join(",", method.TypeArguments.Select(StructuralTypeNameRuleOracleTests.TypeIdentity)) : "";
                    result.Add(symbol.OriginalDefinition.GetDocumentationCommentId() + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(symbol.ContainingType) + ":" + methodArguments);
                }
                return result.ToArray();
            }
            Assert.That(Snapshot(after), Is.EqualTo(Snapshot(before)), "Static fields/properties/method groups and constructions must keep identity");
            AssertOperationBindings(before, after);
        }
    }
}
