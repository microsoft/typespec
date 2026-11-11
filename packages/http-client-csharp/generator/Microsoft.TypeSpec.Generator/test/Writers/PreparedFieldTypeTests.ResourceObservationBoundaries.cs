// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void ResourceObservationBoundaryDisposalAbsenceDoesNotEraseExplicitCallCapture(bool declaration, bool overridden)
        {
            var value = Literal("{}");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedResourceCallProbe)), "Observe",
                overridden ? new ValueExpression[] { value, Literal("fixed") } : new ValueExpression[] { value });
            var owner = ResourceObservationOwner(call, declaration);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var operation = nodes.Single(n => n.SynchronousResourceTextAbsence is not null);
            var valueNode = nodes.Single(n => ReferenceEquals(n.Producer, value));
            var callNode = nodes.Single(n => ReferenceEquals(n.Producer, call));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "Observe", Array.Empty<object>()).Runtime, Is.EqualTo("done"));
            Assert.That(PreparedResourceCallProbe.LastCapturedText, Is.EqualTo(overridden ? "fixed" : "\"{}\""));
            Assert.That(operation.SynchronousResourceTextAbsence!.IsCurrent, Is.True);
            Assert.That(callNode.CallProofs?.Selection, Is.Not.Null);
            Assert.That(GraphItems(GraphFacts(prepared, valueNode), "EnclosingCaptures").Length, Is.EqualTo(overridden ? 0 : 1));
            Assert.That(GraphItems(GraphFacts(prepared, valueNode), "EnclosingBarriers"), Is.Empty);
            var graph = prepared.SourceFiles.Single().Observations!;
            Assert.That(graph.UnknownCallerLineSites.Any(s => s.Observer == operation.Id), Is.True);
            Assert.That(graph.KnownImplicitCallerLineSites.Any(s => s.Observer == callNode.Id), Is.True);
        }

        [TestCase(false, "arguments")]
        [TestCase(true, "arguments")]
        [TestCase(false, "method")]
        [TestCase(true, "method")]
        [TestCase(false, "dispose")]
        [TestCase(true, "dispose")]
        public void ResourceObservationBoundaryHeldAbsenceAndGraphInvalidateStickily(bool declaration, string change)
        {
            var value = Literal("{}");
            var arguments = new List<ValueExpression> { value };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(JsonDocument)), "Parse", arguments);
            var owner = ResourceObservationOwner(call, declaration);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var operation = nodes.Single(n => n.SynchronousResourceTextAbsence is not null);
            var held = operation.SynchronousResourceTextAbsence!;
            var graph = prepared.SourceFiles.Single().Observations!;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "Parse", Array.Empty<object>()).Runtime, Is.EqualTo("done"));
            Assert.That(held.IsCurrent, Is.True);
            Assert.That(graph.IsCurrent, Is.True);
            switch (change)
            {
                case "arguments": arguments[0] = Literal("[]"); break;
                case "method": call.MethodName = "Unknown"; break;
                default: prepared.Dispose(); break;
            }
            Assert.That(held.IsCurrent, Is.False);
            Assert.That(graph.IsCurrent, Is.False);
            if (change == "arguments") { arguments[0] = value; }
            else if (change == "method") { call.MethodName = "Parse"; }
            Assert.That(held.IsCurrent, Is.False);
            Assert.That(graph.IsCurrent, Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ResourceObservationBoundaryEnclosingLambdaCaptureStillDominatesDisposalAbsence(bool overridden)
        {
            var value = Literal("{}");
            var resource = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(JsonDocument)), "Parse", new ValueExpression[] { value });
            var scope = new UsingScopeStatement(typeof(JsonDocument), "document", resource, out _);
            scope.Add(new ExpressionStatement(new KeywordExpression("return", Literal("done"))));
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), scope);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe",
                overridden ? new ValueExpression[] { closure, Literal("fixed") } : new ValueExpression[] { closure });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var runtime = EmitReducedWholeFile(CallProofCompilation(), output.Content, "Observe", Array.Empty<object>()).Runtime;
            Assert.That(runtime, overridden ? Is.EqualTo("fixed") : Does.Contain("using"));
            var operation = nodes.Single(n => ReferenceEquals(n.Producer, scope));
            Assert.That(operation.SynchronousResourceTextAbsence?.IsCurrent, Is.True);
            Assert.That(GeneratedReviewCallOccurrence(prepared, parent).CallProofs?.Selection, Is.Not.Null);
            var valueNode = nodes.Single(n => ReferenceEquals(n.Producer, value));
            Assert.That(GraphItems(GraphFacts(prepared, valueNode), "EnclosingCaptures").Length, Is.EqualTo(overridden ? 0 : 1));
            Assert.That(GraphItems(GraphFacts(prepared, valueNode), "EnclosingBarriers"), Is.Empty);
        }

        private static ParameterValueOwner ResourceObservationOwner(ValueExpression call, bool declaration)
        {
            MethodBodyStatement operation;
            if (declaration) { operation = new AssignmentExpression(new DeclarationExpression(typeof(JsonDocument), "document", isUsing: true), call).Terminate(); }
            else { operation = new UsingScopeStatement(typeof(JsonDocument), "document", call, out _); }
            var owner = new ParameterValueOwner(Literal("done"), Array.Empty<ParameterProvider>());
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[] { operation, new ExpressionStatement(new KeywordExpression("return", Literal("done"))) }));
            return owner;
        }
    }
}
