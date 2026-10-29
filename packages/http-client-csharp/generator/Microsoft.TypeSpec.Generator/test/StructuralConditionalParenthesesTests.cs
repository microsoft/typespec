// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        private const string ConditionalParenthesesBranch = "\nprivate int Variant() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 6;\n#endif\n}\n";

        [TestCase("return ((x == y));", "return x == y;")]
        [TestCase("if (((x == y))) return true; return false;", "if (x == y) return true;")]
        [TestCase("while ((x < y)) { x++; } return false;", "while (x < y)")]
        [TestCase("bool flag = ((x != y)); return flag;", "flag = x != y;")]
        [TestCase("return ((x == y)) && ((x != 0));", "return x == y && x != 0;")]
        [TestCase("return ((x == y)) ? true : false;", "return x == y ? true : false;")]
        public async Task StructuralConditionalParenthesesCommonOutsideCalls(string body, string expected)
        {
            var source = "class Clock { public bool M(int x, int y) { " + body + " }" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(expected, output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesPreservesBoundaryCommentsAndLines()
        {
            const string source = "class Clock { public bool M(int x, int y) { return(/*a*/(x == y)/*b*/); }" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.DoesNotContain("return(", output);
            Assert.That(output.Contains("/*a*/") && output.Contains("/*b*/"), Is.True);
            Assert.That(output.Count(c => c == '\n'), Is.EqualTo(source.Count(c => c == '\n')));
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase("return Capture(((x == y)));", "Capture(((x == y)))")]
        [TestCase("return Observe(() => ((x == y)));", "() => ((x == y))")]
        [TestCase("return new[] { ((x == y)) }[0];", "((x == y))")]
        public async Task StructuralConditionalParenthesesProtectedOwnersRetain(string body, string retained)
        {
            var source = "class Clock { static bool Capture(bool v) => v; static bool Observe(System.Func<bool> f) => f(); public bool M(int x, int y) { " + body + " }" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(retained, output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesBranchLocalInactiveTextRetains()
        {
            const string source = "class Clock { public bool M(int x, int y) {\n#if NET8_0_OR_GREATER\nreturn ((x == y));\n#else\nreturn x != y;\n#endif\n} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("return ((x == y));", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase("DEBUG")]
        [TestCase("HAS_FEATURE")]
        public async Task StructuralConditionalParenthesesUnknownFlagsRetain(string flag)
        {
            var source = "class Clock { public bool M(int x, int y) => ((x == y)); private int V() {\n#if " + flag + "\nreturn 1;\n#else\nreturn 0;\n#endif\n} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> ((x == y))", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesKeepsSemanticAndOtherFamiliesParked()
        {
            const string source = "class Clock { private int Value; public bool M(int x, int y) => ((x == y)); public int N() => this.Value + global::System.Int32.MaxValue;" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> x == y", output);
            StringAssert.Contains("this.Value", output);
            StringAssert.Contains("global::System.Int32.MaxValue", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalParenthesesFormerEmptyMetadataPolicyNowAdmitsCommonArrow()
        {
            const string source = "class Clock { public bool M(int x, int y) => ((x == y)); int N() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 0;\n#endif\n} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> x == y", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        private static void AssertConditionalParenthesesOperations(string before, string after)
        {
            foreach (var symbols in new[] { Array.Empty<string>(), new[] { "NET6_0_OR_GREATER" }, new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER" },
                new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER" }, new[] { "NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER", "NET10_0_OR_GREATER" } })
                AssertParenthesesOperations(before, after, parseOptions: new CSharpParseOptions(preprocessorSymbols: symbols.Prepend("EXPERIMENTAL")));
        }
    }
}
