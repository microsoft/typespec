// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
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
        public void DelegateCallProofUsesActualMetadataFieldInvokeContract(bool explicitCapture)
        {
            var receiver = new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed");
            var call = new InvokeMethodExpression(receiver, "Invoke", explicitCapture ?
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
        public void DelegateCallProofNamedOverridesPreserveOtherObservers()
        {
            var receiver = new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed");
            var call = new InvokeMethodExpression(receiver, "Invoke", new ValueExpression[]
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
        public void DelegateCallProofNonobservingFieldInvokeHasIndependentAbsence()
        {
            var call = new InvokeMethodExpression(new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Safe"),
                "Invoke", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void DelegateCallProofUnqualifiedReceiverCannotBorrowContract()
        {
            var call = new InvokeMethodExpression(new MemberExpression(null, "Observed"), "Invoke", new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DelegateCallProofDeclarationOverrideDoesNotUseMemberNameIntent()
        {
            var receiver = new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed")
            {
                Declaration = new CodeWriterDeclaration("Safe")
            };
            var call = new InvokeMethodExpression(receiver, "Invoke", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase("Missing")]
        [TestCase("NotDelegate")]
        [TestCase("Hidden")]
        [TestCase("Instance")]
        public void DelegateCallProofMissingOrNondelegateMembersRetain(string name)
        {
            var call = new InvokeMethodExpression(new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), name),
                "Invoke", new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DelegateCallProofDoesNotRunOpaqueArgumentForApplicability()
        {
            var callbacks = 0;
            var call = new InvokeMethodExpression(new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed"),
                "Invoke", new ValueExpression[] { new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("1"); }) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void DelegateCallProofPropertyGetterIsNotExecutedOrAdmitted()
        {
            PreparedDelegateCallProbe.ResetGetterCalls();
            var call = new InvokeMethodExpression(new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Property"),
                "Invoke", new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            Assert.That(PreparedDelegateCallProbe.GetterCalls, Is.Zero);
        }

        [Test]
        public void DelegateCallProofPreparedAndConsumedByStandardWriter()
        {
            var call = new InvokeMethodExpression(new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed"),
                "Invoke", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
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
        public void DelegateCallProofReceiverMutationInvalidatesHeldCertificate()
        {
            var receiver = new MemberExpression(TypeReferenceExpression.FromType(typeof(PreparedDelegateCallProbe)), "Observed");
            var call = new InvokeMethodExpression(receiver, "Invoke", new ValueExpression[] { Literal(1) });
            var held = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            receiver.Update(memberName: "Safe");
            Assert.That(held!.IsCurrent, Is.False);
            receiver.Update(memberName: "Observed");
            Assert.That(held.IsCurrent, Is.False);
        }
    }
}
