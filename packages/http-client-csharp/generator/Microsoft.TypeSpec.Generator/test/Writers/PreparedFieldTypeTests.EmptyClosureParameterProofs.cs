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
        [TestCase("expression")]
        [TestCase("block")]
        [TestCase("nested")]
        public void EmptyClosureParameterProofCapturesActualOuterParameter(string form)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            ValueExpression closure = form == "block"
                ? new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), new ExpressionStatement(new KeywordExpression("return", call)))
                : new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call);
            if (form == "nested") { closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), closure); }
            var owner = new ParameterValueOwner(closure, new[] { parameter }, form == "nested" ? typeof(Func<Func<string>>) : typeof(Func<string>));
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1 });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void EmptyClosureParameterProofCapturesInstanceReceiver()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(PreparedInstanceCallProbe));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Observe", new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call), new[] { parameter }, typeof(Func<string>));
            var result = PrepareAndRunParameterCall(owner, call, new object[] { new PreparedInstanceCallProbe() });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void EmptyClosureParameterProofCapturesDelegateInvoke()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call), new[] { parameter }, typeof(Func<string>));
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(owner, call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void EmptyClosureParameterProofRetainedBlockMutationInvalidatesHeldChild()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var original = new ExpressionStatement(new KeywordExpression("return", call));
            var statements = new List<MethodBodyStatement> { original };
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), new MethodBodyStatements(statements));
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(closure, new[] { parameter }, typeof(Func<string>)), call, new object[] { 1 });
            using var prepared = result.Plan;
            var held = result.Node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            statements[0] = new ExpressionStatement(new KeywordExpression("return", Literal("changed")));
            Assert.That(held!.IsCurrent, Is.False);
            statements[0] = original;
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void EmptyClosureParameterProofLocalDeclarationStillRetains()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var body = new MethodBodyStatements(new MethodBodyStatement[]
            {
                new ExpressionStatement(new AssignmentExpression(new DeclarationExpression(typeof(int), "local"), Literal(1))),
                new ExpressionStatement(new KeywordExpression("return", call))
            });
            var owner = new ParameterValueOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body), new[] { parameter }, typeof(Func<string>));
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1 });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void EmptyClosureParameterProofParameterListMutationInvalidatesHeldChild()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var parameters = new List<CodeWriterDeclaration?>();
            var closure = new FuncExpression(parameters, call);
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(closure, new[] { parameter }, typeof(Func<string>)), call, new object[] { 1 });
            using var prepared = result.Plan;
            var held = result.Node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            parameters.Add(new CodeWriterDeclaration("x"));
            Assert.That(held!.IsCurrent, Is.False);
            parameters.Clear();
            Assert.That(held.IsCurrent, Is.False);
        }

        [TestCase("ref")]
        [TestCase("out")]
        [TestCase("in")]
        public void EmptyClosureParameterProofIllegalByReferenceCaptureRetains(string modifier)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int), isRef: modifier == "ref", isOut: modifier == "out", isIn: modifier == "in");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owner = new ParameterValueOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call), new[] { parameter }, typeof(Func<string>));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Any(d => d.Id == "CS1628" && d.Severity == DiagnosticSeverity.Error), Is.True);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void EmptyClosureParameterProofCustomBodyCannotBorrowOuterParameter()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var callbacks = 0;
            var body = new MethodBodyStatements(new MethodBodyStatement[]
            {
                new ParameterBlockCustomStatement(() => callbacks++),
                new ExpressionStatement(new KeywordExpression("return", call))
            });
            var owner = new ParameterValueOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body), new[] { parameter }, typeof(Func<string>));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [Test]
        public void EmptyClosureParameterProofDisposalInvalidatesHeldChild()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owner = new ParameterValueOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call), new[] { parameter }, typeof(Func<string>));
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1 });
            using var prepared = result.Plan;
            var held = result.Node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            Assert.That(held!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void EmptyClosureParameterProofNonemptyOrForeignBindingsRetain(bool foreign)
        {
            var detached = new ParameterProvider("p", $"detached", typeof(int));
            var parameter = foreign ? new ParameterProvider("q", $"parameter", typeof(int)) : detached;
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { detached.AsVariable() });
            var closure = new FuncExpression(foreign ? Array.Empty<CodeWriterDeclaration?>() : new CodeWriterDeclaration?[] { new("x") }, call);
            var owner = new ParameterValueOwner(closure, new[] { parameter }, typeof(Func<string>));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Any(d => d.Id == (foreign ? "CS0103" : "CS1593") && d.Severity == DiagnosticSeverity.Error), Is.True);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }
    }
}
