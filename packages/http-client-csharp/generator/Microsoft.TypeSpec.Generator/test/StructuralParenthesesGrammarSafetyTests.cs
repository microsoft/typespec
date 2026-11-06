// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        [TestCase("public int M(long value)=>checked(((int)value));", "checked((int)value)")]
        [TestCase("public int M(bool value)=>((bool)value)?1:2;", "=>(bool)value?1:2")]
        [TestCase("public long M(int value){long result;result=((long)value);return result;}", "result=(long)value")]
        [TestCase("public T? M<T>()where T:struct=>((T?)default(T?));", "=>(T?)default(T?)")]
        [TestCase("public object M(object value)=>((System.Collections.Generic.IList<string>)value);", "=>(System.Collections.Generic.IList<string>)value")]
        [TestCase("public object M(object value)=>((System.Exception[])value);", "=>(System.Exception[])value")]
        public async Task StructuralParenthesesGrammarCastTypesAndContextsPreserveOperations(string member, string expected)
        {
            var source = "class Clock{" + member + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(expected, output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralParenthesesGrammarCastChainTransfersEveryTriviaAndCallerLine(string ending)
        {
            var source = "class Clock{public int M(int value){var result=(/*a*/(" + ending + "(int)value" + ending + ")/*b*/);return result+Line();}static int Line([System.Runtime.CompilerServices.CallerLineNumber]int line=0)=>line;}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("result=/*a*/", output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralParenthesesGrammarCastCaptureAndExplicitOverride(bool explicitText)
        {
            var source = "class Clock{public string M(int value)=>Capture(()=>{return((int)value);}" + (explicitText ? ",\"manual\"" : "") + ");static string Capture(System.Func<int> f,[System.Runtime.CompilerServices.CallerArgumentExpression(\"f\")]string text=null)=>text;}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(explicitText ? "return(int)value" : "return((int)value)", output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralParenthesesGrammarConstructorCaptureAndOverride(bool explicitText)
        {
            var source = "class Holder{public Holder(System.Func<int> f,[System.Runtime.CompilerServices.CallerArgumentExpression(\"f\")]string text=null){}}class Clock{public object M(int value)=>new Holder(()=>{return((int)value);}" + (explicitText ? ",\"manual\"" : "") + ");}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(explicitText ? "return(int)value" : "return((int)value)", output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [Test]
        public async Task StructuralParenthesesGrammarCommonConditionalCastUsesEveryVariantProof()
        {
            var source = "class Clock{public long M(int value)=>((long)value);" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=>(long)value", output);
            AssertConditionalParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [Test]
        public async Task StructuralParenthesesGrammarConditionalLocalTypeMayVaryWithoutChangingGrouping()
        {
            const string source = "class Clock{public long M(){\n#if NET8_0_OR_GREATER\nint value=1;\n#else\nlong value=2;\n#endif\nreturn ((long)value);}}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("return (long)value", output);
            AssertConditionalParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [Test]
        public async Task StructuralParenthesesGrammarBranchLocalCastHasNoAlternateCounterpart()
        {
            const string source = "class Clock{public int M(int value){\n#if NET8_0_OR_GREATER\nreturn ((int)value);\n#else\nreturn ((int)value);\n#endif\n}}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            Assert.That(output, Is.EqualTo(source));
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public void StructuralParenthesesGrammarCastOriginalNoncanonicalConfigurationIsIncluded()
        {
            var source = "class Clock{public long M(int value)=>((long)value);" + ConditionalParenthesesBranch + "}";
            var parse = new CSharpParseOptions(preprocessorSymbols: new[] { "EXPERIMENTAL", "NET10_0_OR_GREATER" });
            var tree = CSharpSyntaxTree.ParseText(source, parse);
            var compilation = CSharpCompilation.Create("C4Noncanonical", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), Array.Empty<TypeReferenceSite>());
            Assert.That(rewriter, Is.Not.Null);
            var output = rewriter!.Visit(tree.GetRoot())!.ToFullString();
            StringAssert.Contains("=>(long)value", output);
            AssertParenthesesOperations(source, output, parseOptions: parse);
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase("public object M(int value)=>((global::System.DateTimeOffset)default).ToString();", "((global::System.DateTimeOffset)default).ToString()")]
        [TestCase("public int M()=>((System.Func<int>)(()=>3))();", "((System.Func<int>)(()=>3))()")]
        [TestCase("public bool M(int value)=>Echo(((int)value)<1,0>1);static bool Echo(bool a,bool b)=>a&&b;", "Echo(((int)value)<1,0>1)")]
        [TestCase("public object this[int value]=>value;public object M(int value)=>this[((int)value)];", "this[((int)value)]")]
        public async Task StructuralParenthesesGrammarCastReceiverAndRelationalArgumentBarriers(string member, string expected)
        {
            var source = "class Clock{" + member + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(expected, output);
            AssertParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralParenthesesGrammarConstructorInitializerRoleStaysOutsideSlice()
        {
            const string source = "class Parent{public Parent(int value){}}class Clock:Parent{public Clock(int value):base(((int)value)) {}}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("base(((int)value))", output);
            AssertParenthesesOperations(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralParenthesesGrammarFinalVisitedThisChildSurvivesRemovalOrRetention(bool receiver)
        {
            var source = "class Clock{private int Value;public object M()=>" + (receiver ? "((long)this.Value).ToString()" : "((long)this.Value)") + ";}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(receiver ? "((long)Value).ToString()" : "=>(long)Value", output);
            AssertParenthesesOperations(source, output, normalizeThisReceiver: true);
        }

        [TestCase("class Clock{int M(int v)=>((int)v);}", "class Clock{int M(int v)=>((short)v);}")]
        [TestCase("class Clock{int M(int v)=>((int)v);}", "class Clock{int M(int v)=>((int)(v+1));}")]
        [TestCase("class Clock{int M(int a,int b,int c)=>(a-b)-c;}", "class Clock{int M(int a,int b,int c)=>a-(b-c);}")]
        public void StructuralParenthesesGrammarOperationOracleRejectsCastTargetOperandOrAssociationCorruption(string before, string after)
        {
            Assert.Throws<AssertionException>(() => AssertParenthesesOperations(before, after));
        }
    }
}
