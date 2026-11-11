// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
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
        public void NamedCallProofReordersMultipleCapturesWithoutChangingValueEdges(bool scoped)
        {
            ValueExpression second = new PositionalParameterReferenceExpression("second", Literal(2));
            ValueExpression first = new PositionalParameterReferenceExpression("first", Literal(1));
            if (scoped) { second = new ScopedApi<int>(second); first = new ScopedApi<int>(first); }
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "Multiple", new[] { second, first });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1|2|1"));
            var selected = ProofProperty(RequireCallProofs(CaptureCallProof(call, compilation)), "Selection");
            Assert.That(selected, Is.Not.Null);
            var map = (DeclaredArgumentMap)ProofProperty(selected!, "Arguments")!;
            Assert.That(map.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 1, 0 }));
            Assert.That(map.EvaluationOrder[0].SuppliedExpression, Is.SameAs(second));
            Assert.That(map.EvaluationOrder[1].SuppliedExpression, Is.SameAs(first));
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0, 1 }));
            Assert.That(map.HasImplicitCallerLine, Is.True);
        }

        [TestCase("value", "fixed")]
        [TestCase("null", "")]
        [TestCase("default", "")]
        public void NamedCallProofExplicitOverrideReleasesOnlyOneCapture(string kind, string expected)
        {
            ValueExpression value = kind switch
            {
                "default" => new KeywordExpression("default", null),
                "null" => Null,
                _ => Literal("fixed")
            };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "Multiple", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("second", Literal(2)),
                new PositionalParameterReferenceExpression("first", Literal(1)),
                new PositionalParameterReferenceExpression("firstExpression", value)
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(expected + "|2|1"));
            var proofs = RequireCallProofs(CaptureCallProof(call, compilation));
            var selected = ProofProperty(proofs, "Selection");
            Assert.That(selected, Is.Not.Null);
            var map = (DeclaredArgumentMap)ProofProperty(selected!, "Arguments")!;
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 1 }));
            Assert.That(map.HasImplicitCallerLine, Is.True);
            Assert.That(map.Parameters[2].Presence, Is.EqualTo(kind switch
            {
                "default" => DeclaredArgumentPresence.ExplicitDefault,
                "null" => DeclaredArgumentPresence.ExplicitNull,
                _ => DeclaredArgumentPresence.ExplicitValue
            }));
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void NamedCallProofRepeatedCapturesKeepUnsuppressedObserver(bool explicitFirst)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "Repeated", explicitFirst ?
                new ValueExpression[] { Literal(1), new PositionalParameterReferenceExpression("first", Literal("fixed")) } :
                new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(explicitFirst ? "fixed|1" : "1|1"));
            var selected = ProofProperty(RequireCallProofs(CaptureCallProof(call, compilation)), "Selection");
            Assert.That(selected, Is.Not.Null);
            var map = (DeclaredArgumentMap)ProofProperty(selected!, "Arguments")!;
            Assert.That(map.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(map.Parameters[2].Presence, Is.EqualTo(DeclaredArgumentPresence.Omitted));
        }

        [TestCase("unknown")]
        [TestCase("duplicate")]
        [TestCase("missing")]
        [TestCase("modifier")]
        [TestCase("malformed-default")]
        public void NamedCallProofMalformedShapesRetain(string kind)
        {
            var first = new PositionalParameterReferenceExpression(kind == "unknown" ? "unknown" : "first", kind switch
            {
                "modifier" => new ArgumentExpression(Literal(1), true, false),
                "malformed-default" => new KeywordExpression("default", Literal(1)),
                _ => Literal(1)
            });
            var values = kind == "missing" ? new ValueExpression[] { first } : new ValueExpression[]
            {
                first, new PositionalParameterReferenceExpression(kind == "duplicate" ? "first" : "second", Literal(2))
            };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "Multiple", values);
            var proofs = RequireCallProofs(CaptureCallProof(call, CallProofCompilation()));
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Null);
        }

        [Test]
        public void NamedCallProofOpaqueValuesAreNotExecutedForApplicability()
        {
            var callbacks = 0;
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "Multiple", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("second", Literal(2)),
                new PositionalParameterReferenceExpression("first", new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("1"); }))
            });
            var proofs = RequireCallProofs(CaptureCallProof(call, CallProofCompilation()));
            Assert.That(callbacks, Is.Zero);
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void NamedCallProofRetainedOrderMutationCannotReviveHeldSelection()
        {
            var values = new System.Collections.Generic.List<ValueExpression>
            {
                new PositionalParameterReferenceExpression("second", Literal(2)),
                new PositionalParameterReferenceExpression("first", Literal(1))
            };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "Multiple", values);
            var proofs = RequireCallProofs(CaptureCallProof(call, CallProofCompilation()));
            var held = ProofProperty(proofs, "Selection");
            Assert.That(held, Is.Not.Null);
            var saved = values[0];
            values[0] = values[1];
            Assert.That(ProofProperty(held!, "IsCurrent"), Is.False);
            values[0] = saved;
            Assert.That(ProofProperty(held!, "IsCurrent"), Is.False);
        }

        [Test]
        public void NamedCallProofNonobservingOverloadsNeedNoWinner()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedNamedCallProbe)), "SafeNamed", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("second", Literal("b")),
                new PositionalParameterReferenceExpression("first", Literal("a"))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("ab"));
            var proofs = RequireCallProofs(CaptureCallProof(call, compilation));
            Assert.That(ProofProperty(proofs, "Selection"), Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), Is.Not.Null);
        }
    }
}
