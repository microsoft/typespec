// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void CastArgumentProofUsesActualEmittedCastType(bool numeric)
        {
            var argument = Literal(1).CastTo(numeric ? typeof(long) : typeof(object));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), numeric ? "ObserveLong" : "ObserveObject", new[] { argument });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            argument.Write(writer);
            var observed = EmitCallProof(call, compilation);
            var raw = writer.ToString(false);
            Assert.That(raw, Is.EqualTo(numeric ? "((long)1)" : "((object)1)"));
            // CallerArgumentExpression synthesis unwraps the outer parenthesized
            // expression; the actual cast and its raw writer spelling remain.
            Assert.That(observed.Value, Is.EqualTo(raw[1..^1]));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, observed.Method), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.Parameters[0].Value, Is.SameAs(argument));
        }

        [TestCase("nested")]
        [TestCase("typeof")]
        [TestCase("null")]
        public void CastArgumentProofAuditedInnerShapesRemainTyped(string form)
        {
            ValueExpression argument = form switch
            {
                "typeof" => new TypeOfExpression(typeof(int)).CastTo(typeof(object)),
                "null" => Null.CastTo(typeof(string)),
                _ => Literal(1).CastTo(typeof(long)).CastTo(typeof(object))
            };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new[] { argument });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            argument.Write(writer);
            var raw = writer.ToString(false);
            Assert.That(raw, Is.EqualTo(form switch
            {
                "typeof" => "((object)typeof(int))",
                "null" => "((string)null)",
                _ => "((object)((long)1))"
            }));
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(raw[1..^1]));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void CastArgumentProofExplicitOverridePreservesCallerLine()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[]
            {
                Literal(1).CastTo(typeof(object)), new PositionalParameterReferenceExpression("expression", Literal("fixed"))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void CastArgumentProofNonobservingOverloadsNeedNoWinner()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "SafeCast", new ValueExpression[] { Literal("x").CastTo(typeof(string)) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("string"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void CastArgumentProofTargetMutationInvalidatesHeldCertificate()
        {
            var target = new CSharpType(typeof(object));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { new CastExpression(Literal(1), target) });
            var held = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var original = target.Namespace;
            target.Namespace = "Changed";
            Assert.That(held!.IsCurrent, Is.False);
            target.Namespace = original;
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void CastArgumentProofOpaqueOperandDoesNotBorrowCastType()
        {
            var callbacks = 0;
            var argument = new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("1"); }).CastTo(typeof(object));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void CastArgumentProofUserDefinedConversionRetains()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal(1).CastTo(typeof(PreparedCastCallValue)) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Does.Contain(nameof(PreparedCastCallValue)));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void CastArgumentProofInvalidExplicitConversionRetains()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal("x").CastTo(typeof(int)) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(256, typeof(byte))]
        [TestCase(-1, typeof(char))]
        [TestCase(256, typeof(System.Reflection.Metadata.SignatureTypeCode))]
        public void CastArgumentProofConstantOverflowRetains(int value, Type target)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal(value).CastTo(target) });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = Microsoft.CodeAnalysis.CSharp.CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }");
            Assert.That(compilation.AddSyntaxTrees(tree).GetDiagnostics().Any(d => d.Id == "CS0221" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void CastArgumentProofReferenceDowncastKeepsStandardEvidence()
        {
            var argument = Literal("x").CastTo(typeof(object)).CastTo(typeof(string));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("(string)((object)\"x\")"));
            Assert.That(CaptureCallProof(call, compilation).CallProofs?.Selection, Is.Not.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void CastArgumentProofExplicitValueConversionsRemainOutsideBoundedEvidence(bool unboxing)
        {
            var argument = unboxing
                ? Literal(1).CastTo(typeof(object)).CastTo(typeof(int))
                : Literal(1).CastTo(typeof(long)).CastTo(typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Does.StartWith("(int)"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void CastArgumentProofStandardWriterConsumption()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal(1).CastTo(typeof(object)) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = Microsoft.TypeSpec.Generator.Providers.PreparedFieldTypes.Create(new Microsoft.TypeSpec.Generator.Providers.TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(Microsoft.CodeAnalysis.CSharp.CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(held!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void CastArgumentProofWrapperHintCannotChangeActualCastType()
        {
            var argument = new ScopedApi<long>(Literal(1).CastTo(typeof(object)));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveLong", new ValueExpression[] { argument });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }
    }
}
