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
        [TestCase(typeof(int))]
        [TestCase(typeof(PreparedConstructorProbe))]
        public void TypeOfArgumentProofUsesActualSystemTypeValue(Type operand)
        {
            var argument = new TypeOfExpression(operand);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            argument.Write(writer);
            var observed = EmitCallProof(call, compilation);
            Assert.That(observed.Value, Is.EqualTo(writer.ToString(false)));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, observed.Method), Is.True);
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
            Assert.That(selected.Arguments.Parameters[0].Value, Is.SameAs(argument));
        }

        [Test]
        public void TypeOfArgumentProofIgnoresUnrelatedWrapperTypeHint()
        {
            var argument = new ScopedApi<int>(new TypeOfExpression(typeof(PreparedConstructorProbe)));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { argument });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Does.StartWith("typeof("));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.Parameters[0].Value, Is.SameAs(argument));
        }

        [Test]
        public void TypeOfArgumentProofExplicitOverridePreservesCallerLine()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[]
            {
                new TypeOfExpression(typeof(int)), new PositionalParameterReferenceExpression("expression", Literal("fixed"))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("fixed"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void TypeOfArgumentProofNonobservingOverloadsNeedNoWinner()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "SafeType", new ValueExpression[] { new TypeOfExpression(typeof(int)) });
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("type"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void TypeOfArgumentProofCustomWriterDoesNotBorrowBuiltinType()
        {
            var callbacks = 0;
            var argument = new TypeOfArgumentOverride(() => callbacks++);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { argument });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void TypeOfArgumentProofCannotUseWrapperHintForStringParameter()
        {
            var argument = new ScopedApi<string>(new TypeOfExpression(typeof(int)));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "OnlyString", new ValueExpression[] { argument });
            var node = CaptureCallProof(call, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void TypeOfArgumentProofOperandMutationInvalidatesHeldCertificate()
        {
            var operand = new CSharpType(typeof(PreparedConstructorProbe));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { new TypeOfExpression(operand) });
            var held = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var original = operand.Namespace;
            operand.Namespace = "Changed";
            Assert.That(held!.IsCurrent, Is.False);
            operand.Namespace = original;
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void TypeOfArgumentProofUnknownOperandBindingRetains()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { new TypeOfExpression(typeof(PreparedConstructorProbe)) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            var shadow = new CallLookupShadow("Microsoft.TypeSpec.Generator.Tests.TestHelpers", "PreparedConstructorProbe");
            owner.EnsureBuilt();
            shadow.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, shadow }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void TypeOfArgumentProofSystemTypeSourceReplacementRetains()
        {
            var compilation = CallProofCompilation().AddSyntaxTrees(Microsoft.CodeAnalysis.CSharp.CSharpSyntaxTree.ParseText("namespace System { public class Type {} }"));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { new TypeOfExpression(typeof(int)) });
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void TypeOfArgumentProofStandardWriterConsumption()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { new TypeOfExpression(typeof(int)) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(Microsoft.CodeAnalysis.CSharp.CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(held!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        private sealed record TypeOfArgumentOverride(Action Callback) : TypeOfExpression(typeof(int))
        {
            internal override void WriteCore(CodeWriter writer) { Callback(); writer.AppendRaw("1"); }
        }
    }
}
