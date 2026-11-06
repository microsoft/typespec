// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverAllAncestorCapturesAndOverrides(bool explicitText)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{static object Inner(object value)=>value;static object Capture(object value,[System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")]string text=null)=>text;");
                writer.WriteLine($"public object M()=>Capture(Inner({typeof(DateTimeOffset)}.UtcNow){(explicitText ? ",\"manual\"" : "")});");
                writer.WriteRawLine(ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains(explicitText ? "Inner(DateTimeOffset.UtcNow)" : "Inner(global::System.DateTimeOffset.UtcNow)", output);
            AssertStaticMemberBindings(code.Content, output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverConstructorCapturesAndOverrides(bool explicitText)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Holder{public Holder(object value,[System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")]string text=null){}}class Clock{");
                writer.WriteLine($"public object M()=>new Holder({typeof(DateTimeOffset)}.UtcNow{(explicitText ? ",\"manual\"" : "")});");
                writer.WriteRawLine(ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains(explicitText ? "new Holder(DateTimeOffset.UtcNow" : "new Holder(global::System.DateTimeOffset.UtcNow", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverReducedExtensionReceiverCapture(bool explicitText)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;static class Extensions{public static string Capture(this DateTimeOffset value,[System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")]string text=null)=>text;}class Clock{");
                writer.WriteLine($"public string M()=>{typeof(DateTimeOffset)}.UtcNow.Capture({(explicitText ? "\"manual\"" : "")});");
                writer.WriteRawLine(ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains(explicitText ? "=>DateTimeOffset.UtcNow.Capture" : "=>global::System.DateTimeOffset.UtcNow.Capture", output.Replace("=> ", "=>"));
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverUnitCacheCannotAuthorizeAnotherUnit(bool varyingFirst)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{");
                void Varying()
                {
                    writer.WriteRawLine("public object Varying(){\n#if NET8_0_OR_GREATER\nvar DateTimeOffset=default(System.DateTimeOffset);\n#endif");
                    writer.WriteLine($"return {typeof(DateTimeOffset)}.UtcNow;");
                    writer.WriteRawLine("}");
                }
                if (varyingFirst) Varying();
                writer.WriteLine($"public object Stable()=>{typeof(DateTimeOffset)}.UtcNow;");
                if (!varyingFirst) Varying();
                writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Stable()=>DateTimeOffset.UtcNow", output.Replace("=> ", "=>"));
            StringAssert.Contains("return global::System.DateTimeOffset.UtcNow", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverVisibilityIsPerOccurrenceAndOrderIndependent(bool hiddenFirst)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{public object M(){\n" + (hiddenFirst ? "#line hidden" : "#line default"));
                writer.WriteLine($"object first={typeof(DateTimeOffset)}.UtcNow;");
                writer.WriteRawLine(hiddenFirst ? "#line default" : "#line hidden");
                writer.WriteLine($"object second={typeof(DateTimeOffset)}.UtcNow;");
                writer.WriteRawLine("#line default\nreturn second;}" + ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains(hiddenFirst ? "first=global::System.DateTimeOffset.UtcNow" : "first=DateTimeOffset.UtcNow", output);
            StringAssert.Contains(hiddenFirst ? "second=DateTimeOffset.UtcNow" : "second=global::System.DateTimeOffset.UtcNow", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverOuterLexicalUnitMustBeInvariantNotJustLocalFunction()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Plain{public object Pass(object value)=>value;}class Captured{public object Pass(object value,[System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")]string text=null)=>text;}class Clock{public object M(){\n#if NET8_0_OR_GREATER\nvar api=new Captured();\n#else\nvar api=new Plain();\n#endif");
                writer.WriteLine($"object Local()=>api.Pass({typeof(DateTimeOffset)}.UtcNow);");
                writer.WriteRawLine("return Local();}}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.DateTimeOffset.UtcNow", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverGlobalConstHeaderChangesRemainOpaque()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;partial class Clock{");
                writer.WriteLine($"public object M()=>{typeof(DateTimeOffset)}.UtcNow;");
                writer.WriteRawLine(ConditionalParenthesesBranch + "}");
            });
            const string extra = "partial class Clock{\n#if NET8_0_OR_GREATER\nconst int K=300;\n#else\nconst int K=1;\n#endif\n}";
            var output = await Reduce(code, extra);
            StringAssert.Contains("global::System.DateTimeOffset.UtcNow", output);
            AssertBindings(code.Content, output, extra);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverGenericLocalVetoStillAppliesToWholeDocument()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{");
                writer.WriteLine($"public object M()=>{typeof(DateTimeOffset)}.UtcNow;");
                writer.WriteRawLine("int Other(){T Local<T>(T value)=>value;return Local(1);}" + ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.DateTimeOffset.UtcNow", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverAliasFallbackUsesExpressionScope()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;using S=System;class Shadow{public string ToString(int value)=>\"shadow\";}class Clock{public string M(){var Convert=new Shadow();var System=Convert;");
                writer.WriteLine($"return {typeof(Convert)}.ToString(42);");
                writer.WriteRawLine("}" + ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("S::Convert.ToString(42)", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverPreservesConstructedLexicalReceiver()
        {
            var argument = new CSharpType(typeof(Comparer<>).GetGenericArguments()[0]);
            var target = new CSharpType(typeof(Comparer<>), argument);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Collections.Generic;class Clock<T>{");
                writer.WriteLine($"public object M()=>{target}.Default;");
                writer.WriteRawLine(ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Comparer<T>.Default", output);
            StringAssert.DoesNotContain("global::", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [TestCase("global::System.DateTimeOffset", true)]
        [TestCase("global::System./*keep*/DateTimeOffset", false)]
        [TestCase("global::System.\nDateTimeOffset", false)]
        public async Task StructuralConditionalStaticReceiverInternalTriviaAndLineBoundariesRemain(string spelling, bool shorten)
        {
            var source = "using System;class Clock{public object M()=>" + spelling + ".UtcNow;" + ConditionalParenthesesBranch + "}";
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(spelling, StringComparison.Ordinal), spelling.Length), typeof(DateTimeOffset));
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            StringAssert.Contains(shorten ? "=>DateTimeOffset.UtcNow" : spelling + ".UtcNow", output);
            AssertConditionalParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverRawAndEscapedContextualRoots(bool escaped)
        {
            var raw = escaped ? "@field" : "field";
            var source = "using N;namespace N{public static class " + raw + "{public static int Value=>3;}}class Clock{public int M()=>global::N." + raw + ".Value;" + ConditionalParenthesesBranch + "}";
            var spelling = "global::N." + raw;
            var target = new CSharpType("field", "N", false, false, null, Array.Empty<CSharpType>(), true, false);
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { new TypeReferenceSite(new TextSpan(source.IndexOf(spelling, StringComparison.Ordinal), spelling.Length), target) }));
            StringAssert.Contains(escaped ? "@field.Value" : "N.field.Value", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase(0)]
        [TestCase(1)]
        public async Task StructuralConditionalStaticReceiverDuplicateAndCorruptProvenanceRetains(int kind)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{");
                writer.WriteLine($"public object M()=>{typeof(DateTimeOffset)}.UtcNow;");
                writer.WriteRawLine(ConditionalParenthesesBranch + "}");
            });
            var sites = kind == 0 ? code.TypeReferences!.Concat(code.TypeReferences!).ToArray() : code.TypeReferences!.Select(static s => s with { Type=(CSharpType)typeof(TimeSpan) }).ToArray();
            var output = await Reduce(new CodeFile(code.Content, code.Name, sites));
            StringAssert.Contains("global::System.DateTimeOffset.UtcNow", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [TestCase("unknown")]
        [TestCase("branchLocal")]
        public async Task StructuralConditionalStaticReceiverUnprovenConfigurationOrUnitRetains(string kind)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{");
                if (kind == "branchLocal") writer.WriteRawLine("public object M(){\n#if NET8_0_OR_GREATER");
                else writer.WriteRawLine("public object M(){");
                writer.WriteLine($"return {typeof(DateTimeOffset)}.UtcNow;");
                if (kind == "branchLocal") writer.WriteRawLine("#else\nreturn null;\n#endif");
                writer.WriteRawLine("}");
                writer.WriteRawLine(kind == "unknown" ? ConditionalParenthesesBranch.Replace("NET8_0_OR_GREATER", "UNKNOWN_FLAG") : "");
                writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.DateTimeOffset.UtcNow", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [TestCase("class Clock{object M()=>System.DateTimeOffset.UtcNow;}", "class Clock{object M()=>System.DateTime.UtcNow;}")]
        [TestCase("class Clock{object M()=>System.Math.Abs(-3);}", "class Clock{object M()=>System.Math.Abs(-4);}")]
        public void StructuralConditionalStaticReceiverOracleRejectsChangedReceiverOrArgument(string before, string after)
        {
            Assert.Throws<AssertionException>(() => AssertParenthesesOperations(before, after));
        }
    }
}
