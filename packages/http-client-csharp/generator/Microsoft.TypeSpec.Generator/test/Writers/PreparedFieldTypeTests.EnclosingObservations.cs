// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void EnclosingObservationProofOuterOverrideDoesNotClearChildObserver(bool outerOverride)
        {
            var value = Literal(1);
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { value });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", outerOverride
                ? new ValueExpression[] { creation, new PositionalParameterReferenceExpression("expression", Literal("fixed")) }
                : new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            var observed = EmitCallProof(call, compilation).Value;
            Assert.That(observed, outerOverride ? Is.EqualTo("fixed") : Does.Contain(nameof(PreparedConstructorProbe)));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call));
            var child = nodes.Single(n => ReferenceEquals(n.Producer, creation));
            var leaf = nodes.Single(n => ReferenceEquals(n.Producer, value));
            Assert.That(GraphItems(GraphFacts(prepared, parent), "OwnCaptures"), Has.Length.EqualTo(outerOverride ? 0 : 1));
            Assert.That(GraphItems(GraphFacts(prepared, child), "EnclosingCaptures"), Has.Length.EqualTo(outerOverride ? 0 : 1));
            Assert.That(GraphItems(GraphFacts(prepared, child), "OwnCaptures"), Has.Length.EqualTo(1));
            Assert.That(GraphItems(GraphFacts(prepared, leaf), "EnclosingCaptures"), Has.Length.EqualTo(outerOverride ? 1 : 2));
        }

        [Test]
        public void EnclosingObservationProofSharedNamedEdgesReleaseOnlyOverriddenInput()
        {
            var creation = new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            var right = new PositionalParameterReferenceExpression("right", creation);
            var left = new PositionalParameterReferenceExpression("left", creation);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedConstructionArgumentProbe)), "ObservePair", new ValueExpression[]
            {
                right, left, new PositionalParameterReferenceExpression("leftExpression", Literal("fixed"))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed|new object()"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call));
            var rightRoot = nodes.Single(n => ReferenceEquals(n.Producer, right));
            var leftRoot = nodes.Single(n => ReferenceEquals(n.Producer, left));
            var capture = GraphItems(GraphFacts(prepared, parent), "OwnCaptures").Single();
            Assert.That(GraphMember(capture, "InputParameterOrdinal"), Is.EqualTo(1));
            Assert.That(GraphMember(capture, "SuppliedArgumentRoot"), Is.EqualTo(rightRoot.Id));
            Assert.That(GraphItems(GraphFacts(prepared, rightRoot), "EnclosingCaptures"), Has.Length.EqualTo(1));
            Assert.That(GraphItems(GraphFacts(prepared, leftRoot), "EnclosingCaptures"), Is.Empty);
            var children = nodes.Where(n => ReferenceEquals(n.Producer, creation)).ToArray();
            Assert.That(children, Has.Length.EqualTo(2));
            Assert.That(children.Select(n => GraphItems(GraphFacts(prepared, n), "EnclosingCaptures").Length), Is.EqualTo(new[] { 1, 0 }));
        }

        [Test]
        public void EnclosingObservationProofDirectAbsenceDoesNotClearDescendantCapture()
        {
            var value = Literal(1);
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { value });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "SafeCast", new ValueExpression[] { creation });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("object"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(parent.CallProofs?.Selection, Is.Null);
            Assert.That(parent.CallProofs?.ObservationAbsence, Is.Not.Null);
            Assert.That(GraphItems(GraphFacts(prepared, parent), "OwnCaptures"), Is.Empty);
            Assert.That(GraphItems(GraphFacts(prepared, nodes.Single(n => ReferenceEquals(n.Producer, value))), "EnclosingCaptures"), Has.Length.EqualTo(1));
        }

        [Test]
        public void EnclosingObservationProofUnknownParentBarrierSurvivesSelectedChild()
        {
            var creation = new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            // Explicit unconstrained generics now have a producer. Keep this
            // original unknown-parent barrier anchor genuinely unavailable.
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGraphObservationProbe)), "UnknownConstrained", new ValueExpression[] { creation })
            { TypeArguments = new CSharpType[] { typeof(int) } };
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("new object()"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call));
            var child = nodes.Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(parent.CallProofs?.Selection, Is.Null);
            Assert.That(child.CallProofs?.Selection, Is.Not.Null);
            Assert.That(child.CallProofs?.ObservationAbsence, Is.Not.Null);
            Assert.That(GraphMember(GraphFacts(prepared, parent), "DirectKnowledge")!.ToString(), Is.EqualTo("Unavailable"));
            Assert.That(GraphItems(GraphFacts(prepared, child), "EnclosingBarriers"), Is.Not.Empty);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void EnclosingObservationProofSupportedGenericParentRetainsCaptureAcrossChild(bool closure)
        {
            var leaf = Literal("safe");
            ValueExpression argument = closure ? new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), leaf) : new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGraphObservationProbe)), closure ? "UnknownClosure" : "Unknown", new[] { argument })
            { TypeArguments = new CSharpType[] { typeof(int) } };
            var compilation = CallProofCompilation();
            var runtime = EmitCallProof(call, compilation).Value;
            if (closure) { Assert.That(runtime, Does.Contain("=>")); }
            else { Assert.That(runtime, Is.EqualTo("new object()")); }
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call));
            var child = nodes.Single(n => ReferenceEquals(n.Producer, argument));
            Assert.That(parent.CallProofs?.Selection, Is.Not.Null);
            Assert.That(GraphItems(GraphFacts(prepared, parent), "OwnCaptures"), Has.Length.EqualTo(1));
            Assert.That(GraphItems(GraphFacts(prepared, child), "EnclosingCaptures"), Has.Length.EqualTo(1));
            Assert.That(GraphItems(GraphFacts(prepared, child), "EnclosingBarriers"), Is.Empty);
            if (closure)
            {
                var inner = nodes.Single(n => ReferenceEquals(n.Producer, leaf));
                Assert.That(GraphItems(GraphFacts(prepared, inner), "EnclosingCaptures"), Has.Length.EqualTo(1));
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void EnclosingObservationProofCallerLineSitesAreFileLevel(bool explicitLine)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", explicitLine
                ? new ValueExpression[] { Literal(1), Literal("fixed"), Literal(123) }
                : new ValueExpression[] { Literal(1), Literal("fixed") });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var parent = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var view = GraphView(prepared);
            Assert.That(GraphItems(view, "KnownImplicitCallerLineSites"), Has.Length.EqualTo(explicitLine ? 0 : 1));
            Assert.That(GraphItems(GraphFacts(prepared, parent), "OwnCaptures"), Is.Empty);
        }

        [Test]
        public void EnclosingObservationProofHeldFactsInvalidateOnMutationAndRestoration()
        {
            var value = Literal(1);
            var arguments = new List<ValueExpression> { value };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", arguments);
            Assert.That(EmitCallProof(call, CallProofCompilation()).Value, Is.EqualTo("1"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var leaf = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, value));
            var held = GraphFacts(prepared, leaf);
            Assert.That(GraphMember(held, "IsCurrent"), Is.True);
            arguments[0] = Literal(2);
            Assert.That(GraphMember(held, "IsCurrent"), Is.False);
            arguments[0] = value;
            Assert.That(GraphMember(held, "IsCurrent"), Is.False);
        }

        [Test]
        public void EnclosingObservationProofWriterReadsExactCurrentOccurrenceWithoutReplay()
        {
            var callbacks = 0;
            object? duringWrite = null;
            var callback = new SourceCallbackExpression(writer =>
            {
                callbacks++;
                duringWrite = GraphMember(writer, "CurrentSourceObservations");
                writer.AppendRaw("1");
            });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { callback });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            _ = GraphView(prepared);
            Assert.That(callbacks, Is.Zero);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(duringWrite, Is.Not.Null);
            Assert.That(GraphItems(duringWrite!, "EnclosingBarriers"), Is.Not.Empty);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void EnclosingObservationProofRepeatedTargetsKeepCaptureParameterIdentity(bool overrideFirst)
        {
            var value = new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGraphObservationProbe)), "Repeated", overrideFirst
                ? new ValueExpression[] { value, new PositionalParameterReferenceExpression("first", Literal("fixed")) }
                : new ValueExpression[] { value });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(overrideFirst ? "fixed|new object()" : "new object()|new object()"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var parent = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var own = GraphItems(GraphFacts(prepared, parent), "OwnCaptures");
            Assert.That(own.Select(c => GraphMember(c, "CaptureParameterOrdinal")), Is.EqualTo(overrideFirst ? new object[] { 2 } : new object[] { 1, 2 }));
            Assert.That(own.All(c => Equals(GraphMember(c, "InputParameterOrdinal"), 0)), Is.True);
        }

        [Test]
        public void EnclosingObservationProofRejectsForeignOccurrenceAndInvalidatesDisposedHandles()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var first = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            using var second = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = first.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var foreign = second.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var view = GraphView(first);
            Assert.That(view.GetType().GetMethod("GetCurrent", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(view, new object[] { foreign }), Is.Null);
            var held = GraphFacts(first, node);
            Assert.That(GraphMember(held, "IsCurrent"), Is.True);
            first.Dispose();
            Assert.That(GraphMember(held, "IsCurrent"), Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void EnclosingObservationProofImplicitCollectionOrResourceHazardDoesNotCaptureBody(bool resource)
        {
            var value = resource ? (ValueExpression)new NewInstanceExpression(typeof(System.IO.MemoryStream), Array.Empty<ValueExpression>()) : Literal("abc");
            var bodyValue = Literal("x");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "SafeCast", new ValueExpression[] { bodyValue });
            MethodBodyStatement operation;
            if (resource)
            {
                var scope = new UsingScopeStatement(typeof(System.IO.MemoryStream), "stream", value, out _);
                scope.Add(new ExpressionStatement(call));
                operation = scope;
            }
            else
            {
                var loop = new ForEachStatement(typeof(char), "item", value, false, out _);
                loop.Body.Add(new ExpressionStatement(call));
                operation = loop;
            }
            var owner = new ParameterValueOwner(Literal("done"), Array.Empty<ParameterProvider>());
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[] { operation, new ExpressionStatement(new KeywordExpression("return", Literal("done"))) }));
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var source = nodes.Single(n => ReferenceEquals(n.Producer, value));
            var body = nodes.Single(n => ReferenceEquals(n.Producer, bodyValue));
            Assert.That(GraphItems(GraphFacts(prepared, source), "EnclosingBarriers"), Is.Not.Empty);
            Assert.That(GraphItems(GraphFacts(prepared, body), "EnclosingBarriers"), Is.Empty);
            Assert.That(nodes.Single(n => ReferenceEquals(n.Producer, call)).CallProofs?.ObservationAbsence, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [Test]
        public void EnclosingObservationProofExplicitOverrideDoesNotReleaseConditionalSource()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal(1), Literal("fixed") });
            var directive = new IfElsePreprocessorStatement("GRAPH_CONFIG", new ExpressionStatement(call), new ExpressionStatement(call));
            var owner = new ParameterValueOwner(Literal("done"), Array.Empty<ParameterProvider>());
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[] { directive, new ExpressionStatement(new KeywordExpression("return", Literal("done"))) }));
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Where(n => ReferenceEquals(n.Producer, call)).ToArray();
            Assert.That(nodes, Has.Length.EqualTo(2));
            foreach (var node in nodes)
            {
                Assert.That(node.IntrinsicSource.WithinConditional, Is.True);
                Assert.That(node.IntrinsicSource.InactiveVariants, Is.EqualTo(SourceFactState.Present));
                var facts = GraphFacts(prepared, node);
                Assert.That(GraphItems(facts, "OwnCaptures"), Is.Empty);
                Assert.That(GraphItems(facts, "EnclosingBarriers").Any(b => GraphMember(b, "Kind")!.ToString() == "Configuration"), Is.True);
            }
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [Test]
        public void EnclosingObservationProofUnknownArgumentBarrierCrossesLambda()
        {
            var leaf = Literal("safe");
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), leaf);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGraphObservationProbe)), "UnknownClosureConstrained", new ValueExpression[] { closure })
            { TypeArguments = new CSharpType[] { typeof(int) } };
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Does.Contain("=>"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            Assert.That(GraphItems(GraphFacts(prepared, nodes.Single(n => ReferenceEquals(n.Producer, closure))), "EnclosingBarriers"), Is.Not.Empty);
            Assert.That(GraphItems(GraphFacts(prepared, nodes.Single(n => ReferenceEquals(n.Producer, leaf))), "EnclosingBarriers"), Is.Not.Empty);
        }

        [Test]
        public void EnclosingObservationProofLateWriterMutationInvalidatesWithoutReplay()
        {
            var receiverType = new CSharpType(typeof(PreparedCastCallProbe));
            var callbacks = 0;
            object? held = null;
            var callback = new SourceCallbackExpression(writer =>
            {
                callbacks++;
                held = GraphMember(writer, "CurrentSourceObservations");
                Assert.That(held, Is.Not.Null);
                receiverType.Namespace = "Changed";
                writer.AppendRaw("1");
            });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(receiverType), "ObserveObject", new ValueExpression[] { callback });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.False);
            Assert.That(GraphMember(held!, "IsCurrent"), Is.False);
        }

        private static object GraphView(PreparedFieldTypes prepared) => GraphMember(prepared.SourceFiles.Single(), "Observations")!;
        private static object GraphFacts(PreparedFieldTypes prepared, PreparedSourceOccurrence occurrence)
        {
            var view = GraphView(prepared);
            var get = view.GetType().GetMethod("GetCurrent", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            Assert.That(get, Is.Not.Null);
            var facts = get!.Invoke(view, new object[] { occurrence });
            Assert.That(facts, Is.Not.Null);
            return facts!;
        }
        private static object? GraphMember(object value, string name)
        {
            var property = value.GetType().GetProperty(name, BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            Assert.That(property, Is.Not.Null, name);
            return property!.GetValue(value);
        }
        private static object[] GraphItems(object value, string name) => ((IEnumerable)GraphMember(value, name)!).Cast<object>().ToArray();
    }
}
