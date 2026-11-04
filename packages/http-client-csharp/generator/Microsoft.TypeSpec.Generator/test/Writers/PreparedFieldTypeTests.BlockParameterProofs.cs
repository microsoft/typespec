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
        public void BlockParameterProofActualEmittedReturnRegion(bool list)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var result = PrepareAndRunParameterCall(ParameterBlockOwner(call, new[] { parameter }, list), call, new object[] { 1 });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void BlockParameterProofActualInstanceReceiver()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(PreparedInstanceCallProbe));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Observe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndRunParameterCall(ParameterBlockOwner(call, new[] { parameter }, true), call, new object[] { new PreparedInstanceCallProbe() });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void BlockParameterProofActualDelegateInvoke()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(ParameterBlockOwner(call, new[] { parameter }, true), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void BlockParameterProofRetainedStatementsInvalidateHeldChildDirectly()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var original = new ExpressionStatement(new KeywordExpression("return", call));
            var statements = new List<MethodBodyStatement> { original };
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(statements));
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1 });
            using var prepared = result.Plan;
            var held = result.Node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            statements[0] = new ExpressionStatement(new KeywordExpression("return", Literal("changed")));
            Assert.That(held!.IsCurrent, Is.False);
            statements[0] = original;
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void BlockParameterProofLocalBindingRegionRetains()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
            {
                new DeclareLocalFunctionStatement(new CodeWriterDeclaration("Local"), Array.Empty<ParameterProvider>(), typeof(int), Literal(1)),
                new ExpressionStatement(new KeywordExpression("return", call))
            }));
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1 });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void BlockParameterProofLocalDeclarationDoesNotAcquireParameterEvidence(bool reuseParameterDeclaration)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var variable = parameter.AsVariable();
            var local = reuseParameterDeclaration ? variable : new VariableExpression(typeof(int), "local");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { variable });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
            {
                new ExpressionStatement(new AssignmentExpression(new DeclarationExpression(local), Literal(1))),
                new ExpressionStatement(new KeywordExpression("return", call))
            }));
            if (!reuseParameterDeclaration)
            {
                var result = PrepareAndRunParameterCall(owner, call, new object[] { 1 });
                using var plan = result.Plan;
                Assert.That(result.Runtime, Is.EqualTo("p"));
                Assert.That(result.Node.CallProofs?.Selection, Is.Null);
                Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
                return;
            }
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Any(d => d.Id is "CS0128" or "CS0136" && d.Severity == DiagnosticSeverity.Error), Is.True);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void BlockParameterProofUnknownCustomStatementDoesNotVetoIndependentLiteralCall()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            var callbacks = 0;
            owner.Methods[0].Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
            {
                new ParameterBlockCustomStatement(() => callbacks++),
                new ExpressionStatement(new KeywordExpression("return", call))
            }));
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        private sealed class ParameterBlockCustomStatement(Action callback) : ExpressionStatement(Literal(0))
        {
            internal override void WriteCore(CodeWriter writer) { callback(); writer.WriteRawLine("int ignored = 0;"); }
        }

        private static ParameterValueOwner ParameterBlockOwner(InvokeMethodExpression call, ParameterProvider[] parameters, bool list)
        {
            var owner = new ParameterValueOwner(call, parameters);
            owner.EnsureBuilt();
            MethodBodyStatement body = new ExpressionStatement(new KeywordExpression("return", call));
            if (list) { body = new MethodBodyStatements(new[] { body }); }
            owner.Methods[0].Update(bodyStatements: body);
            return owner;
        }
    }
}
