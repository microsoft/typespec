// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
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
        public void ReducedReceiverEvidenceGenericSourcePartialUsesActualSourceParts(bool implementationAttribute)
        {
            var attribute = "[global::System.Runtime.CompilerServices.CallerArgumentExpression(\"receiver\")] ";
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                "namespace SourceCalls { public static partial class Probe { public static partial string Generic<T>(this T receiver, int value, " +
                (implementationAttribute ? "" : attribute) + "string expression = \"\"); } public static partial class Probe { public static partial string Generic<T>(this T receiver, int value, " +
                (implementationAttribute ? attribute : "") + "string expression) => expression; } }"));
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Generic", new ValueExpression[] { Literal(2) }) { ExtensionType = LoadedSourceCallType() };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, compilation, new[] { parameter }, _ => new object[] { 1 }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo(implementationAttribute ? "" : "p"));
            Assert.That(result.Selection is not null, Is.EqualTo(!implementationAttribute));
            Assert.That(result.Absence, Is.Null);
            if (!implementationAttribute)
            {
                Assert.That(result.Selection!.Contract.Parts, Has.Length.EqualTo(2));
                Assert.That(result.Selection.Contract.SourceDeclarations, Has.Length.EqualTo(2));
                Assert.That(result.Selection.Contract.Parts.All(p => p.Parameters[0].Type.SpecialType == SpecialType.System_Int32), Is.True);
            }
        }

        [Test]
        public void ReducedReceiverEvidenceInferredTypeDependsOnCurrentEmittedParameter()
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "GenericSafe", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, CallProofCompilation(), new[] { parameter }, _ => new object[] { 1 }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("safe"));
            var selected = result.Selection;
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var graph = prepared.SourceFiles.Single().Observations!.GetCurrent(node);
            Assert.That(selected?.IsCurrent, Is.True);
            Assert.That(graph?.IsCurrent, Is.True);
            parameter.Update(type: typeof(string));
            Assert.That(selected!.IsCurrent, Is.False);
            Assert.That(graph!.IsCurrent, Is.False);
            parameter.Update(type: typeof(int));
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(graph.IsCurrent, Is.False);
        }

        [TestCase("Generic")]
        [TestCase("EchoReceiver")]
        public void ReducedReceiverEvidenceNativeReducedContractRetainsReceiverSubstitution(string method)
        {
            var compilation = CallProofCompilation();
            var receiver = compilation.GetSpecialType(SpecialType.System_Int32);
            var definition = compilation.GetTypeByMetadataName(typeof(PreparedStaticExtensionProbe).FullName!)!.GetMembers(method).OfType<IMethodSymbol>().Single();
            var original = definition.Construct(receiver);
            Assert.That(original.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            var reduced = original.ReduceExtensionMethod(receiver);
            Assert.That(reduced, Is.Not.Null);
            var contract = DeclaredCallableContract.FromSymbol(reduced!, compilation);
            Assert.That(reduced!.TypeArguments.Single().SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(reduced.GetTypeInferredDuringReduction(reduced.ReducedFrom!.TypeParameters[0])!.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(contract.IsAvailable, Is.True);
            Assert.That(contract.OriginalSymbol, Is.SameAs(reduced));
            Assert.That(contract.Parameters[0].SymbolType!.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            if (method == "EchoReceiver") { Assert.That(((IMethodSymbol)contract.DeclarationSymbol!).ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Int32)); }
        }

        [Test]
        public void ReducedReceiverEvidenceSubstitutedReturnFeedsObservingParent()
        {
            var fixture = CreateReducedWholeFileOwner(false);
            fixture.Call.MethodName = "EchoReceiver";
            fixture.Call.Arguments = Array.Empty<ValueExpression>();
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { fixture.Call });
            fixture.Owner.Methods[0].Update(bodyExpression: parent);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { fixture.Owner }, fixture.Compilation, _ => true);
            var childNode = GeneratedReviewCallOccurrence(prepared, fixture.Call);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var selected = childNode.CallProofs?.Selection;
            var output = new TypeProviderWriter(fixture.Owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(EmitReducedWholeFile(fixture.Compilation, output.Content, "ObserveObject").Runtime, Is.EqualTo("p.EchoReceiver()"));
            Assert.That(selected, Is.Not.Null);
            Assert.That(((IMethodSymbol)selected!.Contract.DeclarationSymbol!).ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(childNode.CallProofs?.ObservationAbsence, Is.Not.Null);
            Assert.That(parentNode.CallProofs?.Selection, Is.Not.Null);
            Assert.That(prepared.SourceFiles.Single().Observations!.GetCurrent(childNode)!.EnclosingCaptures, Has.Length.EqualTo(1));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ReducedReceiverEvidenceUsesLiteralOrSelectedChildReturn(bool childCall)
        {
            var fixture = CreateReducedWholeFileOwner(false);
            ValueExpression receiver = childCall ? new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedStaticExtensionProbe)), "Produce", Array.Empty<ValueExpression>()) : Literal(1);
            fixture.Call.InstanceReference = receiver;
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { fixture.Owner }, fixture.Compilation, _ => true);
            var selected = GeneratedReviewCallOccurrence(prepared, fixture.Call).CallProofs?.Selection;
            var output = new TypeProviderWriter(fixture.Owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(fixture.Compilation, output.Content);
            if (childCall)
            {
                Assert.That(actual.Runtime, Does.Contain("PreparedStaticExtensionProbe.Produce()"));
                Assert.That(GeneratedReviewCallOccurrence(prepared, receiver).CallProofs?.Selection, Is.Not.Null);
            }
            else { Assert.That(actual.Runtime, Is.EqualTo("1")); }
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.Parameters[0].SuppliedExpression, Is.SameAs(receiver));
        }

        [Test]
        public void ReducedReceiverEvidenceDoesNotBorrowUnselectedChildReturn()
        {
            var fixture = CreateReducedWholeFileOwner(false);
            var receiver = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedStaticExtensionProbe)), "Unselected", new ValueExpression[] { Literal(1) });
            fixture.Call.InstanceReference = receiver;
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { fixture.Owner }, fixture.Compilation, _ => true);
            var output = new TypeProviderWriter(fixture.Owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(EmitReducedWholeFile(fixture.Compilation, output.Content).Runtime, Does.Contain("Unselected(1)"));
            var child = GeneratedReviewCallOccurrence(prepared, receiver);
            Assert.That(child.CallProofs?.Selection, Is.Null);
            Assert.That(child.CallProofs?.ObservationAbsence, Is.Not.Null);
            var parent = GeneratedReviewCallOccurrence(prepared, fixture.Call);
            Assert.That(parent.CallProofs?.Selection, Is.Null);
            Assert.That(parent.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void ReducedReceiverEvidenceInfersOnlyDirectReceiverTypeParameter(bool source, bool safe)
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var call = new InvokeMethodExpression(parameter.AsVariable(), safe ? "GenericSafe" : "Generic", new ValueExpression[] { Literal(2) })
            { ExtensionType = source ? LoadedSourceCallType() : typeof(PreparedStaticExtensionProbe) };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, StaticExtensionCompilation(source), new[] { parameter }, _ => new object[] { 1 }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo(safe ? "safe" : "p"));
            Assert.That(result.Actual.TypeArguments.Single().SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(result.Selection, Is.Not.Null);
            Assert.That(((IMethodSymbol)result.Selection!.Contract.DeclarationSymbol!).Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(result.Selection.Arguments.Parameters[0].Presence, Is.EqualTo(DeclaredArgumentPresence.ReducedReceiver));
            Assert.That(result.Absence is not null, Is.EqualTo(safe));
        }

        [Test]
        public void ReducedReceiverEvidenceGenericIgnoresVariableAndWrapperHints()
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var receiver = new ScopedApi<string>(new VariableExpression(typeof(Uri), parameter.AsVariable().Declaration));
            var call = new InvokeMethodExpression(receiver, "Generic", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, CallProofCompilation(), new[] { parameter }, _ => new object[] { 1 }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            Assert.That(result.Actual.TypeArguments.Single().SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(result.Selection, Is.Not.Null);
            Assert.That(((IMethodSymbol)result.Selection!.Contract.DeclarationSymbol!).Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
        }

        [Test]
        public void ReducedReceiverEvidenceDoesNotInferFromOtherFormalInputs()
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "ArgumentDependent", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, CallProofCompilation(), new[] { parameter }, _ => new object[] { 1 }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("dependent"));
            Assert.That(result.Actual.TypeArguments.Single().SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(result.Selection, Is.Null);
            Assert.That(result.Absence, Is.Null);
        }

        [Test]
        public void ReducedReceiverEvidenceDoesNotInferThroughConstraintFamily()
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(string));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "ConstrainedReceiver", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, CallProofCompilation(), new[] { parameter }, _ => new object[] { "text" }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("constraint"));
            Assert.That(result.Selection, Is.Null);
            Assert.That(result.Absence, Is.Null);
        }
    }
}
