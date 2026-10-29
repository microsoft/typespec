// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.IO;
using System.Reflection;
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
        [TestCase("CancellationToken")]
        [TestCase("int")]
        [TestCase("string")]
        [TestCase("DateTimeOffset")]
        public async Task StructuralOptionalDefaultExactParameterTypeKeepsMetadataAndCalls(string type)
        {
            var source = "using System; using System.Threading; class Clock { public static object M(" + type + " value = default(" + type + ")) => value; public object Call() => M(); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value = default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultConstructorParameterKeepsMetadata()
        {
            const string source = "using System.Threading; class Clock { public Clock(CancellationToken token = default(CancellationToken)) {} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("token = default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultGenericParameterKeepsLexicalIdentity()
        {
            const string source = "class Clock { public static T M<T>(T value = default(T)) => value; public object Call() => M<int>(); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("T value = default)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultBoundaryCommentsRemainOwned()
        {
            const string source = "class Clock { public int M(int value = /*a*/default(int)/*b*/) => value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("/*a*/default/*b*/", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [TestCase("int?", "int")]
        [TestCase("long", "int")]
        public async Task StructuralOptionalDefaultDifferentParameterTypeRetains(string parameter, string operand)
        {
            var source = "class Clock { public object M(" + parameter + " value = default(" + operand + ")) => value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("default(" + operand + ")", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [TestCase("default(/*keep*/int)")]
        [TestCase("default(\nint)")]
        public async Task StructuralOptionalDefaultInteriorTriviaOrLinesRetain(string expression)
        {
            var source = "class Clock { public int M(int value = " + expression + ") => value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(expression, output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultOtherExpressionContextsStayParked()
        {
            const string source = "class Clock { static int Echo(int value) => value; public int M() { int value = default(int); return Echo(default(int)) + value; } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("value = default(int)", output);
            StringAssert.Contains("Echo(default(int))", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public async Task StructuralOptionalDefaultConditionalDocumentRemainsConservative()
        {
            const string source = "using System.Threading; class Clock { public void M(CancellationToken token = default(CancellationToken)) {} private int V() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 6;\n#endif\n} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("default(CancellationToken)", output);
            AssertOptionalDefaultContracts(source, output);
        }

        [Test]
        public void StructuralOptionalDefaultOlderLanguageVersionRetainsTypedForm()
        {
            const string source = "class Clock { public int M(int value = default(int)) => value; }";
            var parse = new CSharpParseOptions(LanguageVersion.CSharp7);
            var tree = CSharpSyntaxTree.ParseText(source, parse);
            var compilation = CSharpCompilation.Create("DefaultLanguage", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), Array.Empty<TypeReferenceSite>());
            Assert.That(rewriter, Is.Not.Null);
            var output = rewriter!.Visit(tree.GetRoot())!.ToFullString();
            StringAssert.Contains("default(int)", output);
            AssertOptionalDefaultContracts(source, output, parse);
        }

        [Test]
        public void StructuralOptionalDefaultInvalidReferenceDefaultIsNotAValidFastPathInput()
        {
            const string source = "class Clock { public object M(object value = default(string)) => value; }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("InvalidReferenceDefault", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Any(static d => d.Id == "CS1763"), Is.True);
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), Array.Empty<TypeReferenceSite>());
            var output = rewriter?.Visit(tree.GetRoot())?.ToFullString() ?? source;
            StringAssert.Contains("default(string)", output);
            var after = compilation.ReplaceSyntaxTree(tree, CSharpSyntaxTree.ParseText(output));
            Assert.That(after.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error).Select(static d => d.Id),
                Is.EqualTo(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error).Select(static d => d.Id)));
        }

        private static void AssertOptionalDefaultContracts(string before, string after, CSharpParseOptions? parse = null, bool formatterRoute = false)
        {
            string RuntimeValue(object? value) => value == null ? "<null>" : ReferenceEquals(value, Missing.Value) ? "<Missing>" :
                ReferenceEquals(value, DBNull.Value) ? "<DBNull>" : value.GetType().FullName + ":" + Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture);
            string[] ReflectionDefaults(CSharpCompilation compilation)
            {
                using var bytes = new MemoryStream();
                var emitted = compilation.Emit(bytes);
                Assert.That(emitted.Diagnostics.Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var assembly = Assembly.Load(bytes.ToArray());
                return assembly.GetTypes().OrderBy(static type => type.FullName, StringComparer.Ordinal).SelectMany(type =>
                    type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance | BindingFlags.DeclaredOnly).Cast<MethodBase>()
                        .Concat(type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance)))
                    .SelectMany(method => method.GetParameters().Select(parameter => method.DeclaringType!.FullName + ":" + method.Name + ":" +
                        string.Join(",", method.GetParameters().Select(static p => p.ParameterType.ToString())) + ":" + parameter.Position + ":" +
                        parameter.IsOptional + ":" + parameter.HasDefaultValue + ":" + RuntimeValue(parameter.DefaultValue) + ":" + RuntimeValue(parameter.RawDefaultValue)))
                    .OrderBy(static value => value, StringComparer.Ordinal).ToArray();
            }
            (string[] Parameters, string[] Reflection, string Outside) Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source, parse);
                var compilation = CSharpCompilation.Create("OptionalDefaultOracle", new[] { tree }, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var parameters = tree.GetRoot().DescendantNodes().OfType<ParameterSyntax>().ToArray();
                var values = parameters.Select(parameter =>
                {
                    var symbol = (IParameterSymbol)model.GetDeclaredSymbol(parameter)!;
                    var value = symbol.HasExplicitDefaultValue ? symbol.ExplicitDefaultValue : null;
                    return symbol.ContainingSymbol.GetDocumentationCommentId() + ":" + symbol.ContainingSymbol.Name + ":" + symbol.Ordinal + ":" + symbol.Name + ":" +
                        StructuralTypeNameRuleOracleTests.TypeIdentity(symbol.Type) + ":" + symbol.RefKind + ":" + symbol.IsParams + ":" + symbol.IsOptional + ":" +
                        symbol.HasExplicitDefaultValue + ":" + value?.GetType().FullName + ":" + Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture);
                }).ToArray();
                var outside = tree.GetText().WithChanges(parameters.Where(p => p.Default != null).Select(p => new TextChange(p.Default!.Value.Span, "__OPTIONAL_DEFAULT__"))).ToString();
                return (values, ReflectionDefaults(compilation), outside);
            }
            var original = Snapshot(before); var candidate = Snapshot(after);
            Assert.That(candidate.Parameters, Is.EqualTo(original.Parameters), "Parameter type/ref/optional/default metadata must remain exact");
            Assert.That(candidate.Reflection, Is.EqualTo(original.Reflection), "Emitted reflection defaults must distinguish null, Missing and DBNull");
            if (formatterRoute)
                Assert.That(SyntaxFactory.AreEquivalent(CSharpSyntaxTree.ParseText(candidate.Outside, parse).GetRoot(), CSharpSyntaxTree.ParseText(original.Outside, parse).GetRoot()), Is.True);
            else
            {
                Assert.That(candidate.Outside, Is.EqualTo(original.Outside), "All source outside parameter default expressions must stay exact");
                Assert.That(System.Text.RegularExpressions.Regex.Matches(after, "\\r\\n|\\r|\\n").Select(m => m.Value),
                    Is.EqualTo(System.Text.RegularExpressions.Regex.Matches(before, "\\r\\n|\\r|\\n").Select(m => m.Value)));
            }
            AssertParenthesesOperations(before, after, parseOptions: parse);
        }
    }
}
