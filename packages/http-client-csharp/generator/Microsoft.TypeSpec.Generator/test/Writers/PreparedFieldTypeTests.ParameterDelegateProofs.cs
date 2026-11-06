// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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
        public void DelegateParameterProofUsesActualInvokeObserverContract(bool explicitOverride)
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", explicitOverride
                ? new ValueExpression[] { Literal(1), new PositionalParameterReferenceExpression("expression", Literal("fixed")) }
                : new ValueExpression[] { Literal(1) });
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
        public void DelegateParameterProofSafeInvokeProvidesIndependentAbsence()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedSafeParameterDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            PreparedSafeParameterDelegate value = _ => "safe";
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("safe"));
            Assert.That(result.Actual.MethodKind, Is.EqualTo(MethodKind.DelegateInvoke));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void DelegateParameterProofReceiverHintIsNotInvokeEvidence()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var variable = new VariableExpression(typeof(int), parameter.AsVariable().Declaration);
            var call = new InvokeMethodExpression(new ScopedApi<string>(variable), "Invoke", new ValueExpression[] { Literal(1) });
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void DelegateParameterProofParameterMutationInvalidatesHeldInvoke()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            var held = result.Node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            parameter.Update(type: typeof(object));
            Assert.That(held!.IsCurrent, Is.False);
            parameter.Update(type: typeof(PreparedObservedDelegate));
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void DelegateParameterProofGenericDelegateRemainsOutsideBoundedTypeLookup()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(Func<int, string>));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            Func<int, string> value = _ => "generic";
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("generic"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DelegateParameterProofDoesNotBorrowImplementationCallerAttributes()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedSafeParameterDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            PreparedSafeParameterDelegate value = ParameterDelegateLineImplementation;
            Assert.That(value.Method.GetParameters()[0].IsDefined(typeof(System.Runtime.CompilerServices.CallerLineNumberAttribute), false), Is.True);
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("implementation"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Contract.DeclarationSymbol!.MethodKind, Is.EqualTo(MethodKind.DelegateInvoke));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.False);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void DelegateParameterProofByReferenceParameterRetains()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate), isRef: true);
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DelegateParameterProofObjectParameterCannotBorrowDelegateHint()
        {
            var parameter = new ParameterProvider("p", $"object", typeof(object));
            var receiver = new ScopedApi<PreparedObservedDelegate>(parameter.AsVariable());
            var call = new InvokeMethodExpression(receiver, "Invoke", new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(Microsoft.CodeAnalysis.CSharp.CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Any(d => d.Id == "CS1061" && d.Severity == DiagnosticSeverity.Error), Is.True);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void DelegateParameterProofDisposalInvalidatesHeldInvoke()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) });
            PreparedObservedDelegate value = (_, expression, _) => expression!;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { value });
            using var prepared = result.Plan;
            var held = result.Node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            Assert.That(held!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        private static string ParameterDelegateLineImplementation([System.Runtime.CompilerServices.CallerLineNumber] int value = 0) => "implementation";

        [TestCase(false)]
        [TestCase(true)]
        public void DelegateParameterProofUnknownDeclarationOrNonInvokeNameRetains(bool wrongName)
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var receiver = wrongName ? parameter.AsVariable() : new VariableExpression(typeof(PreparedObservedDelegate), "p");
            var call = new InvokeMethodExpression(receiver, wrongName ? "NotInvoke" : "Invoke", new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }
    }
}
