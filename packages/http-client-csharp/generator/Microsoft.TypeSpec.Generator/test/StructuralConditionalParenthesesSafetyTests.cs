// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralConditionalParenthesesMultilineTriviaKeepsLaterCallerLine(string newline)
        {
            var source = "using System.Runtime.CompilerServices; class Clock { static int Line([CallerLineNumber] int line = 0) => line; " +
                "public bool M(int x, int y) { bool value = (/*a*/" + newline + "(x == y)" + newline + "/*b*/); return value && Line() > 0; }" + ConditionalParenthesesBranch.Replace("\n", newline) + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.DoesNotContain("(x == y)", output);
            Assert.That(System.Text.RegularExpressions.Regex.Matches(output, "\\r\\n|\\r|\\n").Select(m => m.Value),
                Is.EqualTo(System.Text.RegularExpressions.Regex.Matches(source, "\\r\\n|\\r|\\n").Select(m => m.Value)));
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalParenthesesHiddenAndVisibleOrderIsOccurrenceOwned(bool hiddenFirst)
        {
            const string hidden = "\n#line hidden\npublic bool Hidden(int x, int y) => ((x == y));\n#line default\n";
            const string visible = "public bool Visible(int x, int y) => ((x == y));";
            var source = "class Clock { " + (hiddenFirst ? hidden + visible : visible + hidden) + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("Hidden(int x, int y) => ((x == y))", output);
            if (hiddenFirst) StringAssert.Contains("Visible(int x, int y) => x == y", output);
            // BeforeFirstLineDirective is deliberately non-visible for this slice.
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesOuterWrapperAroundCallCanReduceWithoutChangingCapturedArgument()
        {
            const string source = "using System.Runtime.CompilerServices; class Clock { static bool Capture(bool value, [CallerArgumentExpression(\"value\")] string text = null) => value; " +
                "public bool M(int x, int y) { return (Capture((x == y))); }" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("return Capture((x == y));", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalParenthesesEnclosingCaptureProtectsLambdaAcrossReturnBoundary(bool explicitOverride)
        {
            var source = "using System.Runtime.CompilerServices; class Clock { static bool Capture(System.Func<bool> f, [CallerArgumentExpression(\"f\")] string text = null) => f(); " +
                "public bool M(int x, int y) => Capture(() => { return ((x == y)); }" + (explicitOverride ? ", \"manual\"" : "") + ");" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("return ((x == y));", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesDifferentVariantValueTypesNeedOnlyGroupingProof()
        {
            const string source = "class Clock { public bool M(int x, int y) {\n#if NET8_0_OR_GREATER\nint left = x; int right = y;\n#else\nlong left = x; long right = y;\n#endif\nreturn ((left == right)); } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("return left == right;", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesGenericLocalFunctionVetoRemains()
        {
            const string source = "class Clock { public bool M(int x, int y) => ((x == y)); private int V() {\n#if NET8_0_OR_GREATER\nint Local<T>() => 8; return Local<int>();\n#else\nreturn 6;\n#endif\n} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> ((x == y))", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesOtherDocumentHeaderProofStillRequired()
        {
            const string source = "class Clock { public bool M(int x, int y) => ((x == y));" + ConditionalParenthesesBranch + "}";
            const string extra = "#if NET8_0_OR_GREATER\nclass Variant<T> {}\n#else\nclass Variant {}\n#endif";
            var output = await Reduce(new CodeFile(source, "Clock.cs"), extra);
            StringAssert.Contains("=> ((x == y))", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesPartialExpressionDirectiveBoundaryRemainsOpaque()
        {
            const string source = "class Clock { public bool M(int x, int y) { return\n#if NET8_0_OR_GREATER\n((x == y))\n#else\nfalse\n#endif\n; } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("((x == y))", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase("((-(x + y)))")]
        [TestCase("((default(int)))")]
        [TestCase("((int)(x + y))")]
        public async Task StructuralConditionalParenthesesPreservesUnsupportedPayloadsButAllowsOuterCastGrouping(string expression)
        {
            var source = "class Clock { public int M(int x, int y) => " + expression + ";" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            var expected = expression == "((int)(x + y))" ? "(int)(x + y)" : expression;
            StringAssert.Contains("=> " + expected, output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesInvocationTargetAtomicBarrierRemains()
        {
            const string source = "class Clock { public int M(System.Func<int, int> f) => ((f))(1);" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("((f))(1)", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public void StructuralConditionalParenthesesOriginalNoncanonicalFlagsAreIncluded()
        {
            const string source = "class Clock { public bool M(int x, int y) => ((x == y));" + ConditionalParenthesesBranch + "}";
            var parse = new CSharpParseOptions(preprocessorSymbols: new[] { "EXPERIMENTAL", "NET10_0_OR_GREATER" });
            var tree = CSharpSyntaxTree.ParseText(source, parse);
            var compilation = CSharpCompilation.Create("NoncanonicalParentheses", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), System.Array.Empty<TypeReferenceSite>());
            Assert.That(rewriter, Is.Not.Null);
            var output = rewriter!.Visit(tree.GetRoot())!.ToFullString();
            StringAssert.Contains("=> x == y", output);
            AssertParenthesesOperations(source, output, parseOptions: parse);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesFinalPayloadIncludesRecordedNamespaceChildren()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; class Clock {");
                writer.WriteLine($"public bool M() => ((typeof({typeof(System.InvalidOperationException)}) == typeof({typeof(System.InvalidOperationException)})));");
                writer.WriteRawLine(ConditionalParenthesesBranch);
                writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("=> typeof(InvalidOperationException) == typeof(InvalidOperationException)", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public void StructuralConditionalParenthesesOracleDetectsChangedOnlyFrameworkBranch()
        {
            const string source = "class Clock { public bool M(int x, int y) => ((x == y));" + ConditionalParenthesesBranch + "}";
            Assert.Throws<AssertionException>(() => AssertConditionalParenthesesOperations(source, source.Replace("return 8;", "return 9;")));
        }
    }
}
