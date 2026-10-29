// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
        [TestCase("class Clock { private int Value; public ref int M() => ref this.Value; }")]
        [TestCase("class Clock { private int Value; static void R(ref int x) { x++; } static void O(out int x) { x = 1; } static int I(in int x) => x; public int M() { R(ref this.Value); O(out this.Value); return I(in this.Value); } }")]
        [TestCase("class Clock { private int storage; private ref int Value => ref storage; public ref int M() => ref this.Value; }")]
        [TestCase("class Clock { private int storage; private ref readonly int Value => ref storage; public ref readonly int M() => ref this.Value; }")]
        [TestCase("class Clock { private int Value; public int M() { ref int x = ref this.Value; x = 1; return this.Value; } }")]
        [TestCase("class Clock { private readonly int Value = 1; public int M() => this.Value; }")]
        [TestCase("class Clock { private volatile int Value; public int M() => this.Value; }")]
        [TestCase("class Base { protected int Value; } class Clock(int seed) : Base { public int M() => this.Value; }")]
        [TestCase("class Clock(int Value) { private int Value; public int M() => this.Value; }")]
        [TestCase("struct Clock { private int Value; public Clock(int x) { this.Value = x; } public readonly int M() => this.Value; }")]
        [TestCase("class Base<T> { protected virtual T Value { get; set; } = default; } class Clock<T> : Base<T> { public T M() => this.Value; }")]
        [TestCase("class Base { protected int Value; } class Clock : Base { protected new int Value; public int M() => this.Value; }")]
        [TestCase("using static Holder; class Holder { public static int Value; } class Clock { private int Value; public int M() => this.Value; }")]
        [TestCase("#nullable enable\nclass Base<T> where T : class { protected T? Value; } class Clock<T> : Base<T> where T : class { public T? M() => this.Value; }")]
        public async Task StructuralThisReceiverStorageAndConstructedOwnerIdentity(string source)
        {
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.DoesNotContain("this.Value", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase("public int M() { int first = this.Value; int Value = 1; return first + Value; }")]
        [TestCase("public int M() { foreach (int Value in new[] { 1 }) { return this.Value; } return 0; }")]
        [TestCase("public int M() { try { throw new System.Exception(); } catch (System.Exception Value) { return this.Value; } }")]
        [TestCase("public int M(object x) { if (x is int Value) return this.Value; return 0; }")]
        [TestCase("public int M() { int N(int Value) => this.Value; return N(1); }")]
        [TestCase("public System.Func<int, int> M() => delegate(int Value) { return this.Value; };")]
        public async Task StructuralThisReceiverAdditionalLexicalShadowsStayQualified(string member)
        {
            var source = "class Clock { private int Value; " + member + " }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this.Value", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverAccessorValueCannotCaptureField()
        {
            const string source = "class Clock { private int value; public int P { set { this.value = value; } } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this.value", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task StructuralThisReceiverPrimaryConstructorOtherPartialStaysQualified(bool otherPartial)
        {
            const string body = "namespace Sample { public partial class Clock { public int M() => this.Value; } }";
            const string extra = "namespace Sample { public class Base { public int Value = 1; } public partial class Clock(int Value) : Base {} }";
            var source = otherPartial ? body : body + extra;
            var output = await Reduce(new CodeFile(source, "Clock.cs"), otherPartial ? extra : null);
            StringAssert.Contains("this.Value", output);
            AssertThisMemberBindings(source, output, otherPartial ? extra : null);
            var trees = otherPartial ? new[] { CSharpSyntaxTree.ParseText(output), CSharpSyntaxTree.ParseText(extra) } : new[] { CSharpSyntaxTree.ParseText(output) };
            var compilation = CSharpCompilation.Create("PrimaryWarningsAsErrors", trees, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary).WithSpecificDiagnosticOptions(
                    new[] { new System.Collections.Generic.KeyValuePair<string, ReportDiagnostic>("CS9179", ReportDiagnostic.Error) }));
            Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [TestCase("public dynamic M(dynamic d) => this.Value + d;")]
        [TestCase("public dynamic M(dynamic d) => d + this.Value;")]
        [TestCase("public dynamic M(dynamic d) => this.Value += d;")]
        [TestCase("public dynamic M(dynamic d) => d = this.Value;")]
        [TestCase("public dynamic M(dynamic d) => d.Call(this.Value);")]
        [TestCase("public dynamic M(dynamic d) => d[this.Value];")]
        public async Task StructuralThisReceiverDynamicParticipatingContextsStayQualified(string member)
        {
            var source = "class Clock { private int Value; " + member + " }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this.Value", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase("this/*a*/.Value")]
        [TestCase("this./*a*/Value")]
        [TestCase("this .Value")]
        [TestCase("this. Value")]
        [TestCase("this\r\n.Value")]
        [TestCase("this\n.Value")]
        public async Task StructuralThisReceiverInternalTokenTriviaAndLineEndingsRetained(string access)
        {
            var source = "class Clock { private int Value; public int M() => " + access + "; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(access, output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverHiddenLineDoesNotSuppressVisibleSiblingProof()
        {
            const string source = "class Clock { private int Value;\n#line hidden\npublic int M() => this.Value;\n#line default\npublic int N() => this.Value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("M() => this.Value", output);
            StringAssert.Contains("N() => Value", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase("Object")]
        [TestCase("@Object")]
        [TestCase("field")]
        public async Task StructuralThisReceiverContextualAndObjectWorkaroundRemain(string identifier)
        {
            var source = "class Clock { private int " + identifier + "; public int M() => this." + identifier + "; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this." + identifier, output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverEscapedFieldAndBoundaryTriviaSurviveComposition()
        {
            const string source = "class Clock { private int @field; public int M() { return(/*a*/this.@field/*b*/); } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.DoesNotContain("this.@field", output);
            StringAssert.Contains("@field", output);
            Assert.That(output.Count(c => c == '\n'), Is.EqualTo(source.Count(c => c == '\n')));
            Assert.That(output.Contains("/*a*/") && output.Contains("/*b*/"), Is.True);
            AssertThisMemberBindings(source, output);
        }

        [TestCase("public int M() => (this.Callback)(1);")]
        [TestCase("public int M() => ((this.Callback))(1);")]
        [TestCase("public int M() => this.Callback(1);")]
        public async Task StructuralThisReceiverDelegateInvocationParserBoundariesStayQualified(string member)
        {
            var source = "class Clock { private System.Func<int, int> Callback = x => x; " + member + " }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this.Callback", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase("disabled")]
        [TestCase("custom")]
        [TestCase("conditional")]
        [TestCase("headerProof")]
        public async Task StructuralThisReceiverEmptyMetadataRespectsWorkspaceGates(string mode)
        {
            if (mode == "disabled") MockHelpers.LoadMockGenerator(outputPath: _directory,
                configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true,\"disable-roslyn-reduce\":true}");
            if (mode == "custom") CodeModelGenerator.Instance.AddRewriter(new Probe());
            var conditional = mode == "conditional" ? "\n#if NET8_0_OR_GREATER\nint N() => 8;\n#endif\n" : "";
            var source = "class Clock { private int Value; public int M() => this.Value; " + conditional + " }";
            var extra = mode == "headerProof" ? "#if NET8_0_OR_GREATER\nclass Variant<T> {}\n#else\nclass Variant {}\n#endif" : null;
            var output = await Reduce(new CodeFile(source, "Clock.cs"), extra);
            StringAssert.Contains("this.Value", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public void StructuralThisReceiverPrimaryConstructorDiagnosticChangesDespiteEqualBinding()
        {
            const string source = "namespace Sample { public partial class Clock { public int M() => this.Value; } }";
            const string extra = "namespace Sample { public class Base { public int Value = 1; } public partial class Clock(int Value) : Base {} }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("PrimaryLookup", new[] { tree, CSharpSyntaxTree.ParseText(extra) }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var member = tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>().Single();
            var model = compilation.GetSemanticModel(tree);
            var replacement = SyntaxFactory.IdentifierName(((IdentifierNameSyntax)member.Name).Identifier);
            var info = model.GetSpeculativeSymbolInfo(member.SpanStart, replacement, SpeculativeBindingOption.BindAsExpression);
            Assert.That(info.Symbol, Is.InstanceOf<IFieldSymbol>());
            var changed = CSharpSyntaxTree.ParseText(source.Replace("this.Value", "Value"));
            var after = compilation.ReplaceSyntaxTree(tree, changed);
            var value = changed.GetRoot().DescendantNodes().OfType<IdentifierNameSyntax>().Last();
            var actual = after.GetSemanticModel(changed).GetSymbolInfo(value);
            Assert.That(actual.Symbol, Is.InstanceOf<IFieldSymbol>());
            Assert.That(actual.Symbol!.GetDocumentationCommentId(), Is.EqualTo(info.Symbol!.GetDocumentationCommentId()));
            Assert.That(compilation.GetDiagnostics().Any(static d => d.Id == "CS9179"), Is.False);
            Assert.That(after.GetDiagnostics().Any(static d => d.Id == "CS9179"), Is.True,
                "Standalone symbol equality cannot prove diagnostic equivalence");
        }

        [Test]
        public void StructuralThisReceiverOracleAcceptsOnlyEquivalentContainingInstance()
        {
            const string prefix = "class Clock { private int Value; public int M(Clock other, int value) => ";
            AssertThisMemberBindings(prefix + "this.Value; }", prefix + "Value; }");
            Assert.Throws<AssertionException>(() => AssertThisMemberBindings(prefix + "this.Value; }", prefix + "other.Value; }"));
            Assert.Throws<AssertionException>(() => AssertThisMemberBindings(prefix + "this.Value; }", prefix + "value; }"));
            Assert.Throws<AssertionException>(() => AssertThisMemberBindings(prefix + "this.Value + 1; }", prefix + "Value - 1; }"));
        }
    }
}
