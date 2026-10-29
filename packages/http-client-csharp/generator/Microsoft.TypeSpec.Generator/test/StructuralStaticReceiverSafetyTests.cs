// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
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
        [Test]
        public async Task StaticReceiverDoesNotConfuseAValueWithTheSameNamedType()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} M(System.DateTimeOffset DateTimeOffset, object System) => {typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("} }");
            });
            var tree = CSharpSyntaxTree.ParseText(code.Content);
            var compilation = CSharpCompilation.Create("SameTypeValueControl", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var model = compilation.GetSemanticModel(tree);
            var parameter = tree.GetRoot().DescendantNodes().OfType<ParameterSyntax>().First();
            var parameterSymbol = (IParameterSymbol)model.GetDeclaredSymbol(parameter)!;
            var receiver = tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>().Single(static member => member.Name.Identifier.ValueText == "Now").Expression;
            var originalType = (INamedTypeSymbol)model.GetSymbolInfo(receiver).Symbol!;
            Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(parameterSymbol.Type, originalType), Is.True,
                "Equal value type is deliberately not evidence of a type-bound replacement");
            var output = await Reduce(code);
            StringAssert.Contains("public DateTimeOffset M(", output);
            StringAssert.Contains("=> global::System.DateTimeOffset.Now", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [Test]
        public async Task StaticReceiverConstructionUsesTheOriginalLexicalTypeParameter()
        {
            var parameter = new CSharpType(typeof(StaticReceiverParameter<>).GetGenericArguments()[0]);
            var comparer = new CSharpType(typeof(Comparer<>), new[] { parameter });
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock<T> {");
                writer.WriteLine($"public object M() => {comparer}.Default;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Comparer<T>.Default", output);
            StringAssert.DoesNotContain("global::System.Collections.Generic.Comparer", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [Test]
        public async Task StaticReceiverSiblingLambdasHaveIndependentValueLookup()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock { public object M() {");
                writer.WriteRawLine("System.Func<object, object, object> blocked = (DateTimeOffset, System) =>");
                writer.WriteLine($"{typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("System.Func<object> first = () =>");
                writer.WriteLine($"{typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("System.Func<object> last = () =>");
                writer.WriteLine($"{typeof(DateTimeOffset)}.Now;");
                writer.WriteRawLine("return last(); } } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("blocked = (DateTimeOffset, System) =>\nglobal::System.DateTimeOffset.Now", output);
            StringAssert.Contains("first = () =>\nDateTimeOffset.Now", output);
            StringAssert.Contains("last = () =>\nDateTimeOffset.Now", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task MultilineStandaloneStaticReceiverCannotShiftLaterCallerLineNumber(string ending)
        {
            var source = "using System; using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() { object value = global::System." + ending +
                "DateTimeOffset.Now; return Line(); } private int Line([CallerLineNumber] int line = 0) => line; } }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var receiver = (MemberAccessExpressionSyntax)tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>()
                .Single(static member => member.Name.Identifier.ValueText == "Now").Expression;
            var site = new TypeReferenceSite(TextSpan.FromBounds(receiver.SpanStart, receiver.Name.Identifier.Span.End), typeof(DateTimeOffset));
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            StringAssert.Contains("global::System." + ending + "DateTimeOffset.Now", output);
            AssertBoundaryTriviaIdentity(source, output);
            AssertStaticMemberBindings(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StaticReceiverProvenanceRejectsMissingOrWrongRecordedTargets(bool wrongType)
        {
            const string source = "using System; namespace Sample { public class Clock { public object M() => global::System.DateTimeOffset.Now; } }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var receiver = (MemberAccessExpressionSyntax)tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>()
                .Single(static member => member.Name.Identifier.ValueText == "Now").Expression;
            var span = TextSpan.FromBounds(receiver.SpanStart, receiver.Name.Identifier.Span.End);
            var sites = wrongType ? new[] { new TypeReferenceSite(span, typeof(TimeSpan)) } : Array.Empty<TypeReferenceSite>();
            var output = await Reduce(new CodeFile(source, "Clock.cs", sites));
            StringAssert.Contains("global::System.DateTimeOffset.Now", output);
            AssertStaticMemberBindings(source, output);
        }

        [Test]
        public async Task StaticReceiverInternalTriviaAndNonReceiverFamiliesRemainUnchanged()
        {
            const string source = "using System; namespace Sample { public class Clock { public object M() => global::System./* keep */DateTimeOffset.Now; public string N() => nameof(global::System.DateTimeOffset.Now); public object P(object value) => (value); public object T() => this; } }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var receiver = (MemberAccessExpressionSyntax)tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>()
                .First(static member => member.Name.Identifier.ValueText == "Now").Expression;
            var site = new TypeReferenceSite(TextSpan.FromBounds(receiver.SpanStart, receiver.Name.Identifier.Span.End), typeof(DateTimeOffset));
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            StringAssert.Contains("global::System./* keep */DateTimeOffset.Now", output);
            StringAssert.Contains("nameof(global::System.DateTimeOffset.Now)", output);
            StringAssert.Contains("P(object value) => value", output);
            StringAssert.Contains("=> this", output);
            AssertBoundaryTriviaIdentity(source, output);
            AssertStaticMemberBindings(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StaticReceiverNameofAndDynamicCallsRemainQualifiedWithoutConditionalGuard(bool dynamicCall)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                if (dynamicCall) writer.WriteLine($"public object M(dynamic value) => {typeof(Convert)}.ToString(value);");
                else writer.WriteLine($"public string M() => nameof({typeof(DateTimeOffset)}.Now);");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains(dynamicCall ? "global::System.Convert.ToString(value)" : "nameof(global::System.DateTimeOffset.Now)", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [Test]
        public async Task StaticReceiverOwnerAliasPreservesNestedTypeAndMember()
        {
            var owner = new CSharpType("Owner", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false);
            var box = new CSharpType("Box", "Fixtures", false, false, owner, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using O = Fixtures.Owner; namespace Fixtures { public class Owner { public class Box { public static int Value => 1; } } } namespace Sample { public class Clock { public class Box {} public class Owner {} public class Fixtures {}");
                writer.WriteLine($"public object M() => {box}.Value;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("O.Box.Value", output);
            AssertStaticMemberBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StaticReceiverContextualIdentifierKeepsSerializedParseAndTerminalToken(bool escaped)
        {
            var token = escaped ? "@await" : "await";
            var method = escaped ? "public async Task<object> M() { await Task.CompletedTask; " : "public object M() { ";
            var source = "using System.Threading.Tasks; using Fixtures; namespace Fixtures { public class @await { public static object Value => null; } } namespace Sample { public class Clock { " + method + "return global::Fixtures." + token + ".Value; } } }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var receiver = (MemberAccessExpressionSyntax)tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>()
                .Single(static member => member.Name.Identifier.ValueText == "Value").Expression;
            var original = CSharpCompilation.Create("ContextualOriginal", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(original.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty,
                "The contextual-keyword fixture must be valid before any reduction");
            var type = new CSharpType("await", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false);
            var site = new TypeReferenceSite(TextSpan.FromBounds(receiver.SpanStart, receiver.Name.Identifier.Span.End), type);
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            if (escaped) StringAssert.Contains("@await.Value", output);
            AssertStaticMemberBindings(source, output);
        }

        [Test]
        public void StaticReceiverInvalidAsyncIdentifierCannotCreateARewrite()
        {
            const string source = "namespace Fixtures { public class @await { public static object Value => null; } } namespace Sample { public class Clock { public async System.Threading.Tasks.Task<object> M() { return global::Fixtures.await.Value; } } }";
            var tree = CSharpSyntaxTree.ParseText(source);
            Assert.That(tree.GetDiagnostics().Any(static diagnostic => diagnostic.Id == "CS4003"), Is.True);
            var compilation = CSharpCompilation.Create("InvalidReceiverInput", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var receiver = (MemberAccessExpressionSyntax)tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>()
                .Single(static member => member.Name.Identifier.ValueText == "Value").Expression;
            var type = new CSharpType("await", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false);
            var site = new TypeReferenceSite(TextSpan.FromBounds(receiver.SpanStart, receiver.Name.Identifier.Span.End), type);
            Assert.That(new StructuralTypeNameReducer(compilation).CreateRewriter(tree.GetRoot(), new[] { site }), Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StaticReceiverFieldKeywordCannotBecomeABackingFieldExpression(bool escaped)
        {
            var token = escaped ? "@field" : "field";
            var source = "using Fixtures; namespace Fixtures { public class @field { public static object Value => null; } } namespace Sample { public class Clock { public object P => global::Fixtures." + token + ".Value; } }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("FieldOriginal", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            var receiver = (MemberAccessExpressionSyntax)tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>()
                .Single(static member => member.Name.Identifier.ValueText == "Value").Expression;
            var type = new CSharpType("field", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false);
            var site = new TypeReferenceSite(TextSpan.FromBounds(receiver.SpanStart, receiver.Name.Identifier.Span.End), type);
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            StringAssert.Contains(escaped ? "=> @field.Value" : "=> global::Fixtures.field.Value", output);
            AssertStaticMemberBindings(source, output);
        }

        private sealed class StaticReceiverParameter<T> { }
    }
}
