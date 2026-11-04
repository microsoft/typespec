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
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase("return-type")]
        [TestCase("missing-return")]
        [TestCase("condition-hint")]
        public void ControlLambdaBoundaryRejectsInvalidReturnOrAssertedCondition(string kind)
        {
            var parameter = new ParameterProvider("p", $"value", typeof(int));
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            ValueExpression condition = kind == "condition-hint"
                ? new ScopedApi<bool>(new VariableExpression(typeof(bool), parameter.AsVariable().Declaration)) : guard.AsVariable();
            var conditional = new IfStatement(condition)
            { new ExpressionStatement(new KeywordExpression("return", kind == "return-type" ? Literal(1) : Literal("text"))) };
            MethodBodyStatement body = kind == "missing-return" ? conditional : new MethodBodyStatements(new MethodBodyStatement[]
            { conditional, new ExpressionStatement(new KeywordExpression("return", Literal("fallback"))) });
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(TestHelpers.PreparedLambdaObservationProbe)), "Safe", new ValueExpression[] { closure });
            var owner = FinalizeControlLambdaOwner(parent, new[] { parameter, guard });
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, parent);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Not.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ControlLambdaBoundaryUnknownConditionDoesNotRunDuringPreparation(bool observing)
        {
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var callbacks = 0;
            var conditional = new IfStatement(new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("guard"); }))
            { new ExpressionStatement(new KeywordExpression("return", Literal("text"))) };
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), new MethodBodyStatements(new MethodBodyStatement[]
            { conditional, new ExpressionStatement(new KeywordExpression("return", Literal("fallback"))) }));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(TestHelpers.PreparedLambdaObservationProbe)), observing ? "Observe" : "Safe", new ValueExpression[] { closure });
            var owner = FinalizeControlLambdaOwner(parent, new[] { new ParameterProvider("p", $"unused", typeof(int)), guard });
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            Assert.That(callbacks, Is.Zero);
            var node = GeneratedReviewCallOccurrence(prepared, parent);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            var result = EmitReducedWholeFile(CallProofCompilation(), output.Content, observing ? "Observe" : "Safe", new object[] { 1, true });
            if (observing) { Assert.That(result.Runtime, Does.Contain("if (guard)")); }
            else { Assert.That(result.Runtime, Is.EqualTo("safe")); }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ControlLambdaBoundaryDeepMutationStalesHeldFacts(bool changeCondition)
        {
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var conditional = new IfStatement(guard.AsVariable())
            { new ExpressionStatement(new KeywordExpression("return", Literal("text"))) };
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), new MethodBodyStatements(new MethodBodyStatement[]
            { conditional, new ExpressionStatement(new KeywordExpression("return", Literal("fallback"))) }));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(TestHelpers.PreparedLambdaObservationProbe)), "Safe", new ValueExpression[] { closure });
            var owner = FinalizeControlLambdaOwner(parent, new[] { new ParameterProvider("p", $"unused", typeof(int)), guard });
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, parent);
            var held = node.CallProofs?.Selection;
            var graph = prepared.SourceFiles.Single().Observations!.GetCurrent(node);
            Assert.That(held?.IsCurrent, Is.True);
            Assert.That(graph?.IsCurrent, Is.True);
            var original = conditional.Condition;
            var body = (List<MethodBodyStatement>)conditional.SourceBody;
            var count = body.Count;
            if (changeCondition) { conditional.Update(condition: Literal(false)); }
            else { body.Add(new ExpressionStatement(new KeywordExpression("return", Literal("changed")))); }
            Assert.That(held!.IsCurrent, Is.False);
            Assert.That(graph!.IsCurrent, Is.False);
            if (changeCondition) { conditional.Update(condition: original); }
            else { body.RemoveAt(count); }
            Assert.That(held.IsCurrent, Is.False);
            Assert.That(graph.IsCurrent, Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ControlLambdaBoundaryExplicitOverrideOnlyReleasesParentCapture(bool explicitOverride)
        {
            var parameter = new ParameterProvider("p", $"value", typeof(int));
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(TestHelpers.PreparedLambdaObservationProbe)), "LeafObserve", new ValueExpression[] { parameter.AsVariable() });
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), ControlParameterBody("if-else", guard.AsVariable(), child));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(TestHelpers.PreparedLambdaObservationProbe)), "Observe",
                explicitOverride ? new ValueExpression[] { closure, Literal("fixed") } : new ValueExpression[] { closure });
            var owner = FinalizeControlLambdaOwner(parent, new[] { parameter, guard });
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            Assert.That(parentNode.CallProofs?.Selection, Is.Not.Null);
            Assert.That(childNode.CallProofs?.Selection, Is.Not.Null);
            var facts = prepared.SourceFiles.Single().Observations!.GetCurrent(childNode);
            Assert.That(facts!.OwnCaptures, Has.Length.EqualTo(1));
            Assert.That(facts.EnclosingCaptures, Has.Length.EqualTo(explicitOverride ? 0 : 1));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var result = EmitReducedWholeFile(CallProofCompilation(), output.Content, "Observe", new object[] { 1, true });
            if (explicitOverride) { Assert.That(result.Runtime, Is.EqualTo("fixed")); }
            else { Assert.That(result.Runtime, Does.Contain("LeafObserve(p)")); }
        }

        private static ParameterValueOwner FinalizeControlLambdaOwner(InvokeMethodExpression parent, ParameterProvider[] parameters)
        {
            var owner = new ParameterValueOwner(parent, parameters);
            owner.EnsureBuilt();
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            FinalizeGeneratedCallFixture(owner);
            return owner;
        }
    }
}
