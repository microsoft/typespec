// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        [TestCase(false)]
        [TestCase(true)]
        public void DirectDelegateCallProofUsesActualFieldInvocation(bool explicitCapture)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed", explicitCapture ?
                new ValueExpression[] { Literal(1), Literal("fixed") } : new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            var observed = EmitCallProof(call, compilation);
            Assert.That(observed.Value, Is.EqualTo(explicitCapture ? "fixed|1" : "1|1"));
            Assert.That(observed.Method.MethodKind, Is.EqualTo(MethodKind.DelegateInvoke));
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, observed.Method), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(explicitCapture ? Array.Empty<int>() : new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
            Assert.That(node.CallProofs!.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DirectDelegateCallProofNamedOverridesPreserveOtherObservers()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("expression", Literal("fixed")),
                new PositionalParameterReferenceExpression("value", Literal(1))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed|1"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 1, 0 }));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void DirectDelegateCallProofSafeFieldHasIndependentAbsence()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Safe", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [TestCase("Missing")]
        [TestCase("NotDelegate")]
        [TestCase("Hidden")]
        [TestCase("Instance")]
        public void DirectDelegateCallProofUnsupportedFieldsRetain(string name)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), name, new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DirectDelegateCallProofNameMutationInvalidatesHeldCertificate()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed", new ValueExpression[] { Literal(1) });
            var held = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            call.Update(methodName: "Safe");
            Assert.That(held!.IsCurrent, Is.False);
            call.Update(methodName: "Observed");
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void DirectDelegateCallProofStandardWriterConsumption()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            prepared.Dispose();
            Assert.That(held!.IsCurrent, Is.False);
        }
    }
}
