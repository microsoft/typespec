// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false, LanguageVersion.CSharp7, false)]
        [TestCase(false, LanguageVersion.CSharp7_1, true)]
        [TestCase(true, LanguageVersion.CSharp2, false)]
        [TestCase(true, LanguageVersion.CSharp3, true)]
        public void DefaultAndArrayArgumentProofUsesActualEmissionLanguage(bool array, LanguageVersion language, bool expected)
        {
            var options = new CSharpParseOptions(language);
            var compilation = CallProofCompilation().RemoveAllSyntaxTrees().AddSyntaxTrees(CSharpSyntaxTree.ParseText("", options));
            ValueExpression argument = array ? new NewArrayExpression(null, new ArrayInitializerExpression(new ValueExpression[] { Literal(1) })) : DefaultOf(typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            using var writer = new CodeWriter();
            call.Write(writer);
            var output = "public class Run { public static string M() { return " + writer.ToString(false) + "; } }";
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output, options)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Length == 0, Is.EqualTo(expected), string.Join("\n", errors.Select(e => e.ToString())));
            Assert.That(selected is not null, Is.EqualTo(expected));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void DefaultAndArrayArgumentProofDoesNotAdmitVoidOrStackAllocation(bool array)
        {
            ValueExpression argument = array ? new NewArrayExpression(typeof(int), new ArrayInitializerExpression(new ValueExpression[] { Literal(1) }), IsStackAlloc: true) : Default.CastTo(typeof(void));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            var node = CaptureCallProof(call, compilation);
            using var writer = new CodeWriter();
            call.Write(writer);
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }")).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors, Is.Not.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Null);
        }

        [Test]
        public void ArrayArgumentProofUsesActualParameterElementFrame()
        {
            var parameter = new ParameterProvider("p", $"element", typeof(int));
            var argument = new NewArrayExpression(typeof(int), new ArrayInitializerExpression(new ValueExpression[] { parameter.AsVariable() }));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { 1 });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("new int[] { p }"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void ArrayArgumentProofRetainedInitializerChangesInvalidateStickily()
        {
            ValueExpression first = Literal(1);
            var values = new List<ValueExpression> { first };
            var argument = new NewArrayExpression(typeof(int), new ArrayInitializerExpression(values));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var node = CaptureCallProof(call, CallProofCompilation());
            var selected = node.CallProofs?.Selection;
            Assert.That(selected?.IsCurrent, Is.True);
            values.Add(Literal(2));
            Assert.That(selected!.IsCurrent, Is.False);
            values.Clear();
            values.Add(first);
            Assert.That(selected.IsCurrent, Is.False);
        }

        [TestCase("int", "(int)default")]
        [TestCase("bool", "(bool)default")]
        [TestCase("char", "(char)default")]
        [TestCase("string", "(string)null")]
        public void DefaultArgumentProofUsesActualScalarCastContext(string kind, string expected)
        {
            CSharpType type = kind switch { "int" => typeof(int), "bool" => typeof(bool), "char" => typeof(char), _ => typeof(string) };
            var argument = DefaultOf(type);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo(expected));
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual.Method), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [TestCase("int", "new int[] { 1, 2 }")]
        [TestCase("string", "new string[] { \"text\", null }")]
        [TestCase("object", "new object[] { 1, \"text\" }")]
        [TestCase("sized", "new int[2]")]
        [TestCase("indexable", "new int[] { 1, 2 }")]
        [TestCase("implicit-int", "new [] { 1, 2 }")]
        [TestCase("implicit-string", "new [] { \"text\", null }")]
        public void ArrayArgumentProofUsesActualExplicitArrayEmission(string form, string expected)
        {
            ValueExpression argument = form switch
            {
                "string" => new NewArrayExpression(typeof(string), new ArrayInitializerExpression(new ValueExpression[] { Literal("text"), Null })),
                "object" => new NewArrayExpression(typeof(object), new ArrayInitializerExpression(new ValueExpression[] { Literal(1), Literal("text") })),
                "sized" => new NewArrayExpression(typeof(int), Size: Literal(2)),
                "indexable" => New.Array(typeof(int), new ValueExpression[] { Literal(1), Literal(2) }),
                "implicit-int" => new NewArrayExpression(null, new ArrayInitializerExpression(new ValueExpression[] { Literal(1), Literal(2) })),
                "implicit-string" => new NewArrayExpression(null, new ArrayInitializerExpression(new ValueExpression[] { Literal("text"), Null })),
                _ => new NewArrayExpression(typeof(int), new ArrayInitializerExpression(new ValueExpression[] { Literal(1), Literal(2) }))
            };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo(expected));
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual.Method), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [Test]
        public void ArrayArgumentProofUnknownSizeDoesNotExecuteCallbackOrBorrowHint()
        {
            var callbacks = 0;
            var size = new SourceCallbackExpression(writer => { callbacks++; writer.AppendRaw("2"); });
            var argument = new NewArrayExpression(typeof(int), Size: size);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            var node = CaptureCallProof(call, compilation);
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("new int[2]"));
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [TestCase("negative-size")]
        [TestCase("bad-element")]
        [TestCase("no-common-type")]
        public void ArrayArgumentProofDoesNotCertifyInvalidKnownForms(string kind)
        {
            var argument = kind == "negative-size" ? new NewArrayExpression(typeof(int), Size: Literal(-1)) :
                kind == "no-common-type" ? new NewArrayExpression(null, new ArrayInitializerExpression(new ValueExpression[] { Literal(1), Literal("text") })) :
                    new NewArrayExpression(typeof(int), new ArrayInitializerExpression(new ValueExpression[] { Literal("text") }));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            using var writer = new CodeWriter();
            call.Write(writer);
            var output = "public class Run { public static string M() => " + writer.ToString(false) + "; }";
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors, Is.Not.Empty);
            Assert.That(selected, Is.Null);
        }
    }
}
