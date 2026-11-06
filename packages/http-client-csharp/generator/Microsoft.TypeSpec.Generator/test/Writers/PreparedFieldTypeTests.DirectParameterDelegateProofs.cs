// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
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
        [Test]
        public void DirectParameterDelegateProofExplicitReceiverDoesNotInventInvokeForAnotherName()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Missing", new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var selected = node.CallProofs?.Selection;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Any(e => e.Id == "CS1061"), Is.True, string.Join("\n", errors.Select(e => e.ToString())));
            Assert.That(selected, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void DirectParameterDelegateProofUsesActualEmittedParameter(bool explicitOverride)
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = parameter.InvokeLambda(explicitOverride ? new ValueExpression[] { Literal(1), new PositionalParameterReferenceExpression("expression", Literal("fixed")) } : new ValueExpression[] { Literal(1) });
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo(explicitOverride ? "fixed" : "1"));
            Assert.That(result.Actual.MethodKind, Is.EqualTo(MethodKind.DelegateInvoke));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, result.Actual), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(explicitOverride ? Array.Empty<int>() : new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
            Assert.That(result.Node.CallProofs!.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DirectParameterDelegateProofSafeDelegateHasIndependentAbsence()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedSafeParameterDelegate));
            var call = parameter.InvokeLambda(Literal(1));
            PreparedSafeParameterDelegate value = _ => "safe";
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("safe"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void DirectParameterDelegateProofDoesNotBorrowNameOrForeignIntent(bool foreign)
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var other = new ParameterProvider("p", $"foreign", typeof(PreparedObservedDelegate));
            var call = foreign ? other.InvokeLambda(Literal(1)) : new InvokeMethodExpression(null, "p", new ValueExpression[] { Literal(1) });
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DirectParameterDelegateProofDoesNotMaterializeLazyParameterCarrier()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = parameter.InvokeLambda(Literal(1));
            var owner = new ParameterValueOwner(call, new[] { parameter }, emptyDocs: true);
            owner.EnsureBuilt();
            Assert.That(parameter.CachedVariableExpression, Is.Null);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(parameter.CachedVariableExpression, Is.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.Content, Does.Contain("p(1)"));
            Assert.That(parameter.CachedVariableExpression, Is.Not.Null);
            Assert.That(selected!.IsCurrent, Is.True);
        }

        [Test]
        public void DirectParameterDelegateProofCapturesOuterParameterThroughEmptyClosure()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = parameter.InvokeLambda(Literal(1));
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call);
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(closure, new[] { parameter }, typeof(Func<string>)), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void DirectParameterDelegateProofHeldFactsInvalidateOnDeclarationChange()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = parameter.InvokeLambda(Literal(1));
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            parameter.Update(name: "changed");
            Assert.That(selected!.IsCurrent, Is.False);
            parameter.Update(name: "p");
            Assert.That(selected.IsCurrent, Is.False);
        }
    }
}
