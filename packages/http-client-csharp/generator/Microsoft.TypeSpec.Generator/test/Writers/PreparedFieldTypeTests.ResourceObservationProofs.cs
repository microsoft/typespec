// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Text.Json;
using Microsoft.CodeAnalysis;
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
        [TestCase(false, "parse")]
        [TestCase(true, "parse")]
        [TestCase(false, "mixed")]
        [TestCase(true, "mixed")]
        [TestCase(false, "opaque")]
        [TestCase(true, "opaque")]
        public void ResourceObservationProofSeparatesNativeDisposalFromResourceText(bool declaration, string kind)
        {
            var callbacks = 0;
            var value = Literal("{}");
            ValueExpression resource = kind == "opaque" ? new ResourceObservationCallback(writer =>
            {
                callbacks++;
                writer.AppendRaw("global::System.Text.Json.JsonDocument.Parse(\"{}\")");
            }) : new InvokeMethodExpression(TypeReferenceExpression.FromType(kind == "parse" ? typeof(JsonDocument) : typeof(PreparedResourceCallProbe)),
                kind == "parse" ? "Parse" : "Make", new ValueExpression[] { value });
            var bodyValue = Literal("body");
            var bodyCall = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "SafeCast", new ValueExpression[] { bodyValue });
            MethodBodyStatement operation;
            if (declaration)
            {
                operation = new AssignmentExpression(new DeclarationExpression(typeof(JsonDocument), "document", isUsing: true), resource).Terminate();
            }
            else
            {
                var scope = new UsingScopeStatement(typeof(JsonDocument), "document", resource, out _);
                scope.Add(new ExpressionStatement(bodyCall));
                operation = scope;
            }
            var owner = new ParameterValueOwner(Literal("done"), Array.Empty<ParameterProvider>());
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(declaration
                ? new MethodBodyStatement[] { operation, new ExpressionStatement(bodyCall), new ExpressionStatement(new KeywordExpression("return", Literal("done"))) }
                : new MethodBodyStatement[] { operation, new ExpressionStatement(new KeywordExpression("return", Literal("done"))) }));
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            Assert.That(callbacks, Is.Zero);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var resourceNode = nodes.Single(n => ReferenceEquals(n.Producer, resource));
            var bodyNode = nodes.Single(n => ReferenceEquals(n.Producer, bodyValue));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(kind == "opaque" ? 1 : 0));
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(compilation, output.Content, kind == "mixed" ? "Make" : "Parse", Array.Empty<object>());
            Assert.That(actual.Runtime, Is.EqualTo("done"));
            Assert.That(actual.Method.ReturnType.Name, Is.EqualTo(nameof(JsonDocument)));
            Assert.That(actual.Method.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_String));
            if (kind != "opaque")
            {
                Assert.That(resourceNode.CallProofs?.Selection, Is.Null);
                Assert.That(resourceNode.CallProofs?.ObservationAbsence, Is.Not.Null);
                Assert.That(resourceNode.CallProofs!.ObservationAbsence!.Candidates.Length, Is.GreaterThan(1));
                Assert.That(resourceNode.CallProofs.ObservationAbsence.Candidates.All(m => m.Parameters.All(p => p.GetAttributes().All(a => a.AttributeClass?.Name != "CallerArgumentExpressionAttribute"))), Is.True);
            }
            Assert.That(GraphItems(GraphFacts(prepared, bodyNode), "EnclosingBarriers"), Is.Empty);
            var resourceFacts = GraphFacts(prepared, resourceNode);
            Assert.That(GraphItems(resourceFacts, "EnclosingCaptures"), Is.Empty);
            Assert.That(GraphItems(resourceFacts, "EnclosingBarriers").Any(), Is.EqualTo(kind != "parse"));
            if (kind != "opaque")
            {
                var valueNode = nodes.Single(n => ReferenceEquals(n.Producer, value));
                Assert.That(GraphItems(GraphFacts(prepared, valueNode), "EnclosingBarriers").Any(), Is.EqualTo(kind != "parse"));
            }
        }

        private sealed record ResourceObservationCallback(Action<CodeWriter> Callback) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer) => Callback(writer);
        }
    }
}
