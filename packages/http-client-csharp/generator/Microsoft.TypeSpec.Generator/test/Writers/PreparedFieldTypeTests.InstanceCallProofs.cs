// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
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
        [Test]
        public void InstanceCallProofUsesActualSelectedReceiverConstructor()
        {
            var receiver = new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            var observed = EmitCallProof(call, compilation);
            Assert.That(observed.Value, Is.EqualTo("1"));
            PreparedInstanceCallProbe.Constructions = 0;
            var node = CaptureCallProof(call, compilation);
            Assert.That(PreparedInstanceCallProbe.Constructions, Is.Zero);
            Assert.That(node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, receiver)).CallProofs?.Selection, Is.Not.Null);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, observed.Method), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void InstanceCallProofExplicitOverridesKeepExactPresence()
        {
            var receiver = new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("line", Literal(123)),
                new PositionalParameterReferenceExpression("expression", Literal("fixed")),
                new PositionalParameterReferenceExpression("value", Literal(1))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.False);
            Assert.That(selected.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 2, 1, 0 }));
        }

        [Test]
        public void InstanceCallProofNonobservingGroupDoesNotSelectWinner()
        {
            var call = new InvokeMethodExpression(new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>()), "Safe", new ValueExpression[] { Literal("x") });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("string"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void InstanceCallProofIgnoresScopedReceiverTypeHint()
        {
            var receiver = new ScopedApi<int>(new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>()));
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1"));
            Assert.That(CaptureCallProof(call, compilation).CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void InstanceCallProofReceiverMutationInvalidatesHeldCertificate()
        {
            var arguments = new List<ValueExpression>();
            var receiver = new NewInstanceExpression(typeof(PreparedInstanceCallProbe), arguments);
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(1) });
            var held = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            arguments.Add(Literal(1));
            Assert.That(held!.IsCurrent, Is.False);
            arguments.Clear();
            Assert.That(held.IsCurrent, Is.False);
        }

        [TestCase("StaticOnly")]
        [TestCase("StaticDelegate")]
        public void InstanceCallProofCannotBorrowStaticMemberFromValueReceiver(string name)
        {
            var call = new InvokeMethodExpression(new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>()), name, new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("class Run { string M() => " + writer.ToString(false) + "; }")).GetDiagnostics()
                .Any(d => d.Id == "CS0176" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void InstanceCallProofMixedStaticGroupRetains()
        {
            var call = new InvokeMethodExpression(new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>()), "Mixed", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("instance"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void InstanceCallProofUnselectedReceiverRetains()
        {
            var receiver = new NewInstanceExpression(typeof(Exception), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(receiver, "ToString", Array.Empty<ValueExpression>());
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("System.Exception: Exception of type 'System.Exception' was thrown."));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, receiver)).CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void InstanceCallProofInvalidReceiverConstructorRetains()
        {
            var receiver = new NewInstanceExpression(typeof(PreparedInstanceCallProbe), new ValueExpression[] { Literal(1) });
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("class Run { string M() => " + writer.ToString(false) + "; }")).GetDiagnostics()
                .Any(d => d.Id == "CS1729" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void InstanceCallProofUnsupportedReceiverShapeRetains(bool cast)
        {
            var creation = new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>(), cast ? null
                : new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>(), UseSingleLine: true));
            ValueExpression receiver = cast ? new ScopedApi<PreparedInstanceCallProbe>(creation.CastTo(typeof(object))) : creation;
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            if (cast)
            {
                using var writer = new CodeWriter();
                call.Write(writer);
                Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("class Run { string M() => " + writer.ToString(false) + "; }")).GetDiagnostics()
                    .Any(d => d.Id == "CS1061" && d.Severity == DiagnosticSeverity.Error), Is.True);
            }
            else { Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("1")); }
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void InstanceCallProofSharedReceiverAndArgumentKeepSeparateEdges()
        {
            var creation = new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(creation, "Safe", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("object"));
            var node = CaptureCallProof(call, compilation);
            var children = node.DescendantsAndSelf().Where(n => ReferenceEquals(n.Producer, creation)).ToArray();
            Assert.That(children, Has.Length.EqualTo(2));
            Assert.That(children.All(c => c.CallProofs?.Selection is not null), Is.True);
            Assert.That(children[0].CallProofs!.Selection!.Occurrence, Is.Not.EqualTo(children[1].CallProofs!.Selection!.Occurrence));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void InstanceCallProofStandardWriterConsumption()
        {
            var receiver = new NewInstanceExpression(typeof(PreparedInstanceCallProbe), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            PreparedInstanceCallProbe.Constructions = 0;
            using var prepared = Microsoft.TypeSpec.Generator.Providers.PreparedFieldTypes.Create(new Microsoft.TypeSpec.Generator.Providers.TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call)).CallProofs?.Selection;
            var child = nodes.Single(n => ReferenceEquals(n.Producer, receiver)).CallProofs?.Selection;
            Assert.That(parent, Is.Not.Null);
            Assert.That(child, Is.Not.Null);
            Assert.That(PreparedInstanceCallProbe.Constructions, Is.Zero);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(parent!.IsCurrent && child!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(parent.IsCurrent, Is.False);
            Assert.That(child!.IsCurrent, Is.False);
        }

        [Test]
        public void InstanceCallProofOpaqueReceiverDoesNotBorrowWrapperHint()
        {
            var callbacks = 0;
            var receiver = new ScopedApi<PreparedInstanceCallProbe>(new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("new global::Microsoft.TypeSpec.Generator.Tests.TestHelpers.PreparedInstanceCallProbe()"); }));
            var call = new InvokeMethodExpression(receiver, "Observe", new ValueExpression[] { Literal(1) });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }
    }
}
