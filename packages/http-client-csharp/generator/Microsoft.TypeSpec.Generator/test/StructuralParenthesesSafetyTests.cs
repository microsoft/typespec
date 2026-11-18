// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("leftCoalesce", "(x ?? y) ?? z")]
        [TestCase("delegateTarget", "((f))(1)")]
        [TestCase("asFusion", "(x)as object")]
        [TestCase("minusFusion", "x-(-y)")]
        [TestCase("optionalDescendant", "value = (1 + (2))")]
        [TestCase("relationalSibling", "Echo(a < b, (x + y))")]
        public async Task StructuralParenthesesRetainsParserAndAncestralBarriers(string kind, string expected)
        {
            var member = kind switch
            {
                "leftCoalesce" => "public string M(string x, string y, string z) => (x ?? y) ?? z;",
                "delegateTarget" => "public int M(System.Func<int, int> f) => ((f))(1);",
                "asFusion" => "public object M(object x) => (x)as object;",
                "minusFusion" => "public int M(int x, int y) => x-(-y);",
                "optionalDescendant" => "public int M(int value = (1 + (2))) => value;",
                _ => "public int M(int a, int b, int x, int y) => Echo(a < b, (x + y)); private int Echo(bool condition, int value) => value;"
            };
            var code = ParenthesesCode(member);
            var output = await Reduce(code);
            StringAssert.Contains(expected, output);
            AssertParenthesesOperations(code.Content, output);
        }

        [TestCase("-")]
        [TestCase("+")]
        [TestCase("~")]
        public async Task StructuralParenthesesCastGroupRemovalPreservesOperandBarrierAndNamespaceShortening(string unary)
        {
            var type = new CSharpType("Number", "Fixtures", true, false, null, Array.Empty<CSharpType>(), true, true);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Fixtures { public struct Number { public static explicit operator Number(int value) => default; } } namespace Sample { public class Clock {");
                writer.WriteLine($"public object M(int value) => (({type})({unary}value));");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("=> (Number)(" + unary + "value)", output);
            StringAssert.DoesNotContain("global::Fixtures.Number", output);
            AssertParenthesesOperations(code.Content, output);
            AssertBoundaryTriviaIdentity(code.Content, output);
        }

        [Test]
        public async Task StructuralParenthesesPreservesSourceCapturedByAnOuterLambdaCall()
        {
            var code = ParenthesesCode("public object M(int x, int y) => Capture(() => { return ((x + y)); }); private object Capture(System.Func<int> value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text;");
            var output = await Reduce(code);
            StringAssert.Contains("return ((x + y))", output);
            AssertParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralParenthesesPreservesReducedExtensionReceiverCapture()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public static class Extensions { public static object Capture(this Func<int> value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text; } public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Seed => default;");
                writer.WriteRawLine("public object M(int x, int y) => ((Func<int>)(() => { return ((x + y)); })).Capture(); } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("return ((x + y))", output);
            AssertParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralParenthesesUnknownDynamicCallRetainsArgumentText()
        {
            var code = ParenthesesCode("public object M(dynamic receiver, int x, int y) => receiver.Use((x + y));");
            var output = await Reduce(code);
            StringAssert.Contains("Use((x + y))", output);
            AssertParenthesesOperations(code.Content, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralParenthesesPreservesEveryDelimiterTriviaAndLaterLineNumber(string ending)
        {
            var member = "public int M(int x, int y) { var value = (/* outer open */" + ending +
                "// inner open leading" + ending + "( /* inner open trailing */ x + y /* inner close leading */ ) // inner close trailing" + ending +
                ") /* outer close trailing */; return Line() + value; } private int Line([System.Runtime.CompilerServices.CallerLineNumber] int line = 0) => line;";
            var code = ParenthesesCode(member);
            var output = await Reduce(code);
            var value = CSharpSyntaxTree.ParseText(output).GetRoot().DescendantNodes().OfType<VariableDeclaratorSyntax>().Single(static variable => variable.Identifier.ValueText == "value");
            Assert.That(value.Initializer!.Value, Is.Not.TypeOf<ParenthesizedExpressionSyntax>());
            AssertBoundaryTriviaIdentity(code.Content, output);
            AssertParenthesesOperations(code.Content, output);
        }

        [Test]
        public void StructuralParenthesesZeroWidthElasticTriviaDoesNotSeparateTokens()
        {
            var tree = CSharpSyntaxTree.ParseText("class Clock { int M(int x) { return(x); } }");
            var wrapper = tree.GetRoot().DescendantNodes().OfType<ParenthesizedExpressionSyntax>().Single();
            var replacement = wrapper.Expression.WithLeadingTrivia(SyntaxFactory.ElasticMarker);
            Assert.That(StructuralParenthesesRules.KeepsTokenBoundaries(wrapper, replacement), Is.False);
        }

        [Test]
        public async Task StructuralParenthesesEmptyMetadataCannotAuthorizeUnrecordedNameReduction()
        {
            const string source = "class Clock { object M() => ((global::System.DateTimeOffset.Now)); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> global::System.DateTimeOffset.Now;", output);
            AssertParenthesesOperations(source, output);
        }

        [TestCase("disabled")]
        [TestCase("custom")]
        [TestCase("conditional")]
        [TestCase("headerProof")]
        public async Task StructuralParenthesesEmptyMetadataRetainsConfigurationAndCustomGates(string mode)
        {
            if (mode == "disabled")
            {
                MockHelpers.LoadMockGenerator(outputPath: _directory,
                configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true,\"disable-roslyn-reduce\":true}");
            }

            if (mode == "custom")
            {
                CodeModelGenerator.Instance.AddRewriter(new Probe());
            }

            var conditional = mode == "conditional" ? "int N() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 0;\n#endif\n}" : "";
            var source = "class Clock { public bool M(int x, int y) => ((x == y)); " + conditional + " }";
            var extra = mode == "headerProof" ? "#if NET8_0_OR_GREATER\nclass Variant<T> {}\n#else\nclass Variant {}\n#endif" : null;
            var output = await Reduce(new CodeFile(source, "Clock.cs"), extra);
            if (mode == "conditional")
            {
                StringAssert.Contains("=> x == y", output);
            }
            else
            {
                StringAssert.Contains("=> ((x == y))", output);
            }

            AssertParenthesesOperations(source, output);
        }

        [Test]
        public void StructuralParenthesesInvalidInputCannotCreateARewriteWithoutMetadata()
        {
            var tree = CSharpSyntaxTree.ParseText("class Clock { int M() => ((1 + )); }");
            Assert.That(tree.GetRoot().ContainsDiagnostics, Is.True);
            var compilation = CSharpCompilation.Create("InvalidParentheses", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), Array.Empty<TypeReferenceSite>()), Is.Null);
        }

        [Test]
        public async Task StructuralParenthesesLazyArgumentFactsAreRequestedOnlyForRealCandidates()
        {
            var code = ParenthesesCode("public int M(int value) => Echo(value); private int Echo(int value) => value;");
            await Reduce(code);
            StringAssert.DoesNotContain("StructuralParentheses.ArgumentListScan", GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary());
        }

        [Test]
        public async Task StructuralParenthesesSiblingCandidatesShareOneOriginalArgumentListFact()
        {
            var code = ParenthesesCode("public int M(int a, int b, int c, int d) => Echo((a + b), (c + d)); private int Echo(int x, int y) => x + y;");
            var output = await Reduce(code);
            StringAssert.Contains("Echo(a + b, c + d)", output);
            Assert.That(Count(GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary(), "StructuralParentheses.ArgumentListScan"), Is.EqualTo(1));
            AssertParenthesesOperations(code.Content, output);
        }
    }
}
