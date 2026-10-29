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
        [TestCase("DayOfWeek")]
        [TestCase("Value")]
        [TestCase("System.Collections.Generic.List<string>")]
        public async Task StructuralOptionalDefaultSupportedConstructedTypesKeepReflectionDefaults(string type)
        {
            var source = "using System; struct Value {} class Clock { public static object M(" + type + " value = default(" + type + ")) => value; public object Call() => M(); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value = default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultNullableConstrainedParameterRetainsWithoutExactAnnotationProof()
        {
            const string source = "#nullable enable\nclass Clock { public static T? M<T>(T? value = default(T?)) where T:class => value; public object? Call() => M<string>(); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("T? value = default(T?)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultNullableValueRetainsWithoutExactAnnotationProof()
        {
            const string source = "class Clock { public int? M(int? value=default(int?))=>value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value=default(int?)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultAliasResolvesSameDeclaredType()
        {
            const string source = "using Token=System.Threading.CancellationToken; class Clock { public void M(Token value=default(Token)) {} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value=default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultDelegateAndLocalFunctionMetadataKeepDefaults()
        {
            const string source = "using System.Threading; delegate void D(CancellationToken token=default(CancellationToken)); class Clock { public int M(){ int Local(int value=default(int))=>value; return Local(); } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("token=default)", output);
            StringAssert.Contains("value=default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralOptionalDefaultEnclosingCaptureProtectsLocalFunctionDeclaration(bool explicitOverride)
        {
            var source = "using System; using System.Runtime.CompilerServices; class Clock { static string Capture(Func<int> f,[CallerArgumentExpression(\"f\")]string text=null)=>text; " +
                "public string M()=>Capture(()=>{int Local(int value=default(int))=>value;return Local();}" + (explicitOverride ? ",\"manual\"" : "") + "); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            Assert.That(output.Contains("value=default(int)"), Is.EqualTo(!explicitOverride));
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultCallerInfoEffectiveArgumentsStayExact()
        {
            const string source = "using System.Runtime.CompilerServices; class Clock { static int Line([CallerLineNumber]int line=default(int))=>line; public int M()=>Line(); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("line=default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [TestCase("dynamic")]
        [TestCase("System.Collections.Generic.List<dynamic>")]
        public async Task StructuralOptionalDefaultDynamicGraphsRemainTyped(string type)
        {
            var source = "class Clock { public object M(" + type + " value=default(" + type + "))=>value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("default(" + type + ")", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultPrimaryConstructorOwnerRemainsExcluded()
        {
            const string source = "class Clock(int value=default(int)) { public int M()=>value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value=default(int)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultIndexerOwnerRemainsExcluded()
        {
            const string source = "class Clock { public int this[int value=default(int)]=>value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value=default(int)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultParenthesizedDeclarationIsNotDirectDefault()
        {
            const string source = "class Clock { public int M(int value=(default(int)))=>value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value=(default(int))", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralOptionalDefaultInternalLineBreakKeepsLaterCallerLine(string newline)
        {
            var source = "using System.Runtime.CompilerServices; class Clock { static int M(int value=default(" + newline + "int))=>value; static int Line([CallerLineNumber]int line=0)=>line; public int Call()=>M()+Line(); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("default(" + newline + "int)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralOptionalDefaultHiddenAndVisibleOrderIsOccurrenceOwned(bool hiddenFirst)
        {
            const string hidden = "\n#line hidden\npublic int Hidden(int value=default(int))=>value;\n#line default\n";
            const string visible = "public int Visible(int value=default(int))=>value;\n";
            var source = "class Clock {" + (hiddenFirst ? hidden + visible : visible + hidden) + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("Hidden(int value=default(int))", output);
            if (hiddenFirst) StringAssert.Contains("Visible(int value=default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [TestCase("disabled")]
        [TestCase("custom")]
        [TestCase("header")]
        public async Task StructuralOptionalDefaultWorkspaceAndHeaderGatesRemain(string mode)
        {
            if (mode == "disabled") MockHelpers.LoadMockGenerator(outputPath: _directory,
                configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true,\"disable-roslyn-reduce\":true}");
            if (mode == "custom") CodeModelGenerator.Instance.AddRewriter(new Probe());
            const string source = "class Clock { public int M(int value=default(int))=>value; }";
            var extra = mode == "header" ? "#if NET8_0_OR_GREATER\nclass Variant<T> {}\n#else\nclass Variant {}\n#endif" : null;
            var output = await Reduce(new CodeFile(source, "Clock.cs"), extra);
            StringAssert.Contains("default(int)", output);
            AssertOptionalDefaultContracts(source, output, formatterRoute: mode == "custom");
        }

        [Test]
        public void StructuralOptionalDefaultOracleRejectsChangedNullableAndPrimitiveDefaults()
        {
            const string nullable = "class Clock { public int? M(int? value=default(int))=>value; }";
            Assert.Throws<AssertionException>(() => AssertOptionalDefaultContracts(nullable, nullable.Replace("default(int)", "default")));
            const string primitive = "class Clock { public int M(int value=default(int))=>value; }";
            Assert.Throws<AssertionException>(() => AssertOptionalDefaultContracts(primitive, primitive.Replace("default(int)", "1")));
            AssertOptionalDefaultContracts(primitive, primitive.Replace("default(int)", "default"));
        }

        [Test]
        public void StructuralOptionalDefaultNullableSemanticRepresentationsDoNotAuthorizeBySpelling()
        {
            foreach (var source in new[]
            {
                "class Clock { public int? M(int? value=default(int?))=>value; }",
                "#nullable enable\nclass Clock { public T? M<T>(T? value=default(T?)) where T:class=>value; }"
            })
            {
                var tree = CSharpSyntaxTree.ParseText(source);
                var compilation = CSharpCompilation.Create("DefaultNullableProbe", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                var model = compilation.GetSemanticModel(tree);
                var parameter = tree.GetRoot().DescendantNodes().OfType<Microsoft.CodeAnalysis.CSharp.Syntax.ParameterSyntax>().Single();
                var symbol = (IParameterSymbol)model.GetDeclaredSymbol(parameter)!;
                var expression = (Microsoft.CodeAnalysis.CSharp.Syntax.DefaultExpressionSyntax)parameter.Default!.Value;
                var declared = model.GetTypeInfo(parameter.Type!); var operand = model.GetTypeInfo(expression.Type);
                Assert.That(symbol.IsOptional && symbol.HasExplicitDefaultValue, Is.True);
                Assert.That(symbol.Type.NullableAnnotation, Is.EqualTo(NullableAnnotation.Annotated));
                Assert.That(operand.Type?.NullableAnnotation, Is.EqualTo(NullableAnnotation.None));
                Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(symbol.Type, operand.Type), Is.False);
                Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(declared.Type, operand.Type), Is.True,
                    "Type-syntax equality must not bypass the stronger chosen parameter-symbol contract");
            }
        }

        [Test]
        public void StructuralOptionalDefaultOracleDoesNotConflateMissingAndNull()
        {
            const string before = "using System.Runtime.InteropServices; class Clock { public object M([Optional] object value)=>value; }";
            const string after = "using System.Runtime.InteropServices; class Clock { public object M(object value=default(object))=>value; }";
            Assert.Throws<AssertionException>(() => AssertOptionalDefaultContracts(before, after));
        }
    }
}
