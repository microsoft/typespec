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
        [TestCase(false)]
        [TestCase(true)]
        public void ConstructionArgumentProofUsesSelectedChildConstructor(bool observingChild)
        {
            var creation = new NewInstanceExpression(observingChild ? typeof(PreparedConstructorProbe) : typeof(object),
                observingChild ? new ValueExpression[] { Literal(1) } : Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            creation.Write(writer);
            var observed = EmitCallProof(call, compilation);
            Assert.That(observed.Value, Is.EqualTo(writer.ToString(false)));
            var node = CaptureCallProof(call, compilation);
            var child = node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(child.CallProofs?.Selection, Is.Not.Null);
            Assert.That(child.CallProofs!.Selection!.Arguments.ImplicitCallerExpressionInputs,
                Is.EqualTo(observingChild ? new[] { 0 } : Array.Empty<int>()));
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, observed.Method), Is.True);
            Assert.That(selected.Arguments.Parameters[0].Value, Is.SameAs(creation));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
            Assert.That(node.CallProofs!.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ConstructionArgumentProofOuterOverrideDoesNotClearChildObserver()
        {
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { Literal(1) });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[]
            {
                creation, new PositionalParameterReferenceExpression("expression", Literal("fixed"))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed"));
            var node = CaptureCallProof(call, compilation);
            var child = node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(child.CallProofs?.Selection?.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ConstructionArgumentProofSharedNodeKeepsNamedEvaluationEdges(bool reversed)
        {
            var creation = new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedConstructionArgumentProbe)), "ObservePair", reversed
                ? new ValueExpression[] { new PositionalParameterReferenceExpression("right", creation), new PositionalParameterReferenceExpression("left", creation) }
                : new ValueExpression[] { creation, creation });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            creation.Write(writer);
            var source = writer.ToString(false);
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(source + "|" + source));
            var node = CaptureCallProof(call, compilation);
            var children = node.DescendantsAndSelf().Where(n => ReferenceEquals(n.Producer, creation)).ToArray();
            Assert.That(children, Has.Length.EqualTo(2));
            Assert.That(children.All(c => c.CallProofs?.Selection is not null), Is.True);
            Assert.That(children[0].CallProofs!.Selection!.Occurrence, Is.Not.EqualTo(children[1].CallProofs!.Selection!.Occurrence));
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0, 1 }));
            Assert.That(selected.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(reversed ? new[] { 1, 0 } : new[] { 0, 1 }));
        }

        [Test]
        public void ConstructionArgumentProofSafeGroupDoesNotSelectWinner()
        {
            var creation = new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "SafeCast", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("object"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void ConstructionArgumentProofChildMutationInvalidatesHeldParent()
        {
            var arguments = new List<ValueExpression> { Literal(1) };
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), arguments);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { creation });
            var held = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var original = arguments[0];
            arguments[0] = Literal(2);
            Assert.That(held!.IsCurrent, Is.False);
            arguments[0] = original;
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void ConstructionArgumentProofNoSelectedChildRetains()
        {
            var creation = new NewInstanceExpression(typeof(Exception), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Does.StartWith("new "));
            var node = CaptureCallProof(call, compilation);
            var child = node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(child.CallProofs?.Selection, Is.Null);
            Assert.That(child.CallProofs?.ObservationAbsence, Is.Not.Null);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ConstructionArgumentProofInvalidConstructorRetains()
        {
            var creation = new NewInstanceExpression(typeof(object), new ValueExpression[] { Literal(1) });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("class Run { object M() => " + writer.ToString(false) + "; }")).GetDiagnostics()
                .Any(d => d.Id == "CS1729" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ConstructionArgumentProofFollowsOnlyOwnWrappedValueEdge(bool cast)
        {
            var creation = new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            ValueExpression value = cast ? creation.CastTo(typeof(object)) : creation;
            var argument = new PositionalParameterReferenceExpression("value", new ScopedApi<int>(value));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Does.Contain("new object()"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.Parameters[0].SuppliedExpression, Is.SameAs(argument));
            Assert.That(selected.Arguments.Parameters[0].Value, Is.SameAs(argument.ParameterValue));
        }

        [Test]
        public void ConstructionArgumentProofDirectAbsenceDoesNotClearChildObserver()
        {
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { Literal(1) });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "SafeCast", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("object"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
            var child = node.DescendantsAndSelf().Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(child.CallProofs?.Selection?.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(child.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ConstructionArgumentProofUnsupportedCreationContextRetains(bool initializer)
        {
            var creation = initializer
                ? new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>(), new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>(), UseSingleLine: true))
                : new NewInstanceExpression(null, Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Does.StartWith("new"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ConstructionArgumentProofStandardWriterConsumption()
        {
            var creation = new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { creation });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = Microsoft.TypeSpec.Generator.Providers.PreparedFieldTypes.Create(new Microsoft.TypeSpec.Generator.Providers.TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call)).CallProofs?.Selection;
            var child = nodes.Single(n => ReferenceEquals(n.Producer, creation)).CallProofs?.Selection;
            Assert.That(parent, Is.Not.Null);
            Assert.That(child, Is.Not.Null);
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
        public void ConstructionArgumentProofWrapperHintCannotChangeActualValueType()
        {
            var argument = new ScopedApi<int>(new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>()));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedConstructionArgumentProbe)), "OnlyInt", new ValueExpression[] { argument });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }
    }
}
