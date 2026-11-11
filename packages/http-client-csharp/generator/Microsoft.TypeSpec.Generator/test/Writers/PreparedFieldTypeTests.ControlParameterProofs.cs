// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
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
        public void ControlParameterProofOpaqueConditionPreservesIndependentLiteral(bool literal)
        {
            var parameter = new ParameterProvider("p", $"value", typeof(int));
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { literal ? Literal(1) : parameter.AsVariable() });
            var callbacks = 0;
            var condition = new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("guard"); });
            var owner = new ParameterValueOwner(call, new[] { parameter, guard });
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: ControlParameterBody("if", condition, call));
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            Assert.That(callbacks, Is.Zero);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var selected = node.CallProofs?.Selection;
            var facts = prepared.SourceFiles.Single().Observations!.GetCurrent(node);
            Assert.That(facts, Is.Not.Null);
            Assert.That(facts!.EnclosingBarriers, Is.Empty);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "ObserveObject", new object[] { 1, true }).Runtime, Is.EqualTo(literal ? "1" : "p"));
            Assert.That(selected is not null, Is.EqualTo(literal));
        }

        [Test]
        public void ControlParameterProofCustomWhileDoesNotBorrowOrdinaryFrame()
        {
            var parameter = new ParameterProvider("p", $"value", typeof(int));
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var callbacks = 0;
            var control = new ControlParameterCustomWhile(guard.AsVariable(), () => callbacks++)
            { new ExpressionStatement(new KeywordExpression("return", call)) };
            var owner = new ParameterValueOwner(call, new[] { parameter, guard });
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
            { control, new ExpressionStatement(new KeywordExpression("return", Literal("fallback"))) }));
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            Assert.That(callbacks, Is.Zero);
            Assert.That(prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Any(n => ReferenceEquals(n.Producer, call)), Is.False);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "ObserveObject", new object[] { 1, true }).Runtime, Is.EqualTo("p"));
        }

        [TestCase("if")]
        [TestCase("if-else")]
        [TestCase("while")]
        [TestCase("do-while")]
        public void ControlParameterProofOwnedBodyMutationInvalidatesStickily(string kind)
        {
            var parameter = new ParameterProvider("p", $"value", typeof(int));
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owner = new ParameterValueOwner(call, new[] { parameter, guard });
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: ControlParameterBody(kind, guard.AsVariable(), call));
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1, true });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            var selected = result.Node.CallProofs?.Selection;
            var facts = prepared.SourceFiles.Single().Observations!.GetCurrent(result.Node);
            Assert.That(selected?.IsCurrent, Is.True);
            Assert.That(facts?.IsCurrent, Is.True);
            var control = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).First(n => n.Producer is IfStatement or WhileStatement or DoWhileStatement).Producer;
            var body = control switch
            {
                IfStatement conditional => conditional.SourceBody,
                WhileStatement loop => loop.SourceBody,
                DoWhileStatement loop => loop.SourceBody,
                _ => throw new InvalidOperationException()
            };
            var retained = (List<MethodBodyStatement>)body;
            var count = retained.Count;
            retained.Add(new ExpressionStatement(new KeywordExpression("return", Literal("changed"))));
            Assert.That(selected!.IsCurrent, Is.False);
            Assert.That(facts!.IsCurrent, Is.False);
            retained.RemoveAt(count);
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(facts.IsCurrent, Is.False);
        }

        private sealed class ControlParameterCustomWhile(ValueExpression condition, Action callback) : WhileStatement(condition)
        {
            internal override void WriteCore(CodeWriter writer) { callback(); base.WriteCore(writer); }
        }

        [TestCase("if", false)]
        [TestCase("if-else", false)]
        [TestCase("while", false)]
        [TestCase("do-while", false)]
        [TestCase("if", true)]
        [TestCase("if-else", true)]
        [TestCase("while", true)]
        [TestCase("do-while", true)]
        public void ControlParameterProofUsesActualOwnedMethodParameter(string kind, bool reduced)
        {
            var parameter = new ParameterProvider("p", $"value", typeof(int));
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var call = reduced
                ? new InvokeMethodExpression(parameter.AsVariable(), "ObserveReceiver", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) }
                : new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owner = new ParameterValueOwner(call, new[] { parameter, guard });
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: ControlParameterBody(kind, guard.AsVariable(), call));
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            FinalizeGeneratedCallFixture(owner);
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1, true });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Contract.IsReduced, Is.EqualTo(reduced));
            var graph = prepared.SourceFiles.Single().Observations!.GetCurrent(result.Node);
            Assert.That(graph, Is.Not.Null);
            Assert.That(graph!.EnclosingBarriers, Is.Empty, "A control condition must not veto an unrelated body occurrence.");
            Assert.That(graph.OwnCaptures, Has.Length.EqualTo(1));
        }

        private static MethodBodyStatement ControlParameterBody(string kind, ValueExpression condition, InvokeMethodExpression call)
        {
            var returned = new ExpressionStatement(new KeywordExpression("return", call));
            var fallback = new ExpressionStatement(new KeywordExpression("return", Literal("fallback")));
            switch (kind)
            {
                case "if":
                    return new MethodBodyStatements(new MethodBodyStatement[] { new IfStatement(condition) { returned }, fallback });
                case "if-else":
                    return new IfElseStatement(new IfStatement(condition) { returned }, fallback);
                case "while":
                    return new MethodBodyStatements(new MethodBodyStatement[] { new WhileStatement(condition) { returned }, fallback });
                default:
                    return new DoWhileStatement(condition) { returned };
            }
        }
    }
}
