// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
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
        [TestCase(false, "ObserveReceiver", "p", 0, false)]
        [TestCase(false, "ObserveValue", "2", 1, false)]
        [TestCase(false, "Safe", "safe", -1, false)]
        [TestCase(false, "ObserveReceiver", "fixed", -1, true)]
        [TestCase(true, "ObserveReceiver", "p", 0, false)]
        [TestCase(true, "ObserveValue", "2", 1, false)]
        [TestCase(true, "Safe", "safe", -1, false)]
        [TestCase(true, "ObserveReceiver", "fixed", -1, true)]
        public void ReducedExtensionProofUsesActualLookupAndOriginalReceiverFormal(bool source, string name, string expected, int captured, bool explicitOverride)
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            CSharpType extension = source ? LoadedSourceCallType() : typeof(PreparedStaticExtensionProbe);
            var call = new InvokeMethodExpression(parameter.AsVariable(), name,
                explicitOverride ? new ValueExpression[] { Literal(2), Literal("fixed") } : new ValueExpression[] { Literal(2) }) { ExtensionType = extension };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, StaticExtensionCompilation(source), new[] { parameter }, _ => new object[] { 1 }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo(expected));
            Assert.That(result.Actual.MethodKind, Is.EqualTo(MethodKind.ReducedExtension));
            Assert.That(result.Actual.ReducedFrom, Is.Not.Null);
            var selected = result.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Contract.IsReduced, Is.True);
            Assert.That(selected.Contract.IsExtension, Is.True);
            Assert.That(selected.Contract.DeclarationSymbol!.Parameters[0].Name, Is.EqualTo("receiver"));
            Assert.That(selected.Arguments.Parameters[0].Presence, Is.EqualTo(DeclaredArgumentPresence.ReducedReceiver));
            Assert.That(selected.Arguments.Parameters[0].EvaluationIndex, Is.EqualTo(-1));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(captured < 0 ? Array.Empty<int>() : new[] { captured }));
            Assert.That(result.Absence is not null, Is.EqualTo(name == "Safe"));
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var facts = prepared.SourceFiles.Single().Observations!.GetCurrent(node);
            Assert.That(facts, Is.Not.Null);
            Assert.That(facts!.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
            Assert.That(facts.OwnBarriers, Is.Empty);
            Assert.That(facts.OwnCaptures, Has.Length.EqualTo(captured < 0 ? 0 : 1));
            if (captured >= 0)
            {
                Assert.That(facts.OwnCaptures[0].InputParameterOrdinal, Is.EqualTo(captured));
                Assert.That(facts.OwnCaptures[0].SuppliedArgumentRoot.EdgePath, Is.EqualTo(node.Id.EdgePath + (captured == 0 ? "/receiver" : "/argument[0]")));
            }
        }

        [Test]
        public void ReducedExtensionProofRetainedCandidateIntentCannotSelectAmbiguousNamespaceGroup()
        {
            var compilation = CallProofCompilation();
            var method = compilation.GetTypeByMetadataName(typeof(PreparedStaticExtensionProbe).FullName!)!.GetMembers("AmbiguousCandidate").OfType<IMethodSymbol>().Single();
            var reduced = method.ReduceExtensionMethod(compilation.GetSpecialType(SpecialType.System_Int32));
            Assert.That(reduced, Is.Not.Null);
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var call = InvokeMethodExpression.FromDeclaredContract(parameter.AsVariable(), DeclaredCallableContract.FromSymbol(reduced!, compilation), new ValueExpression[] { Literal(2) });
            call.ExtensionType = typeof(PreparedStaticExtensionProbe);
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            FinalizeGeneratedCallFixture(owner);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var actual = compilation.AddSyntaxTrees(tree);
            Assert.That(actual.GetDiagnostics().Any(d => d.Id == "CS0121"), Is.True, output.Content);
            var binding = actual.GetSemanticModel(tree).GetSymbolInfo(tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single());
            Assert.That(binding.Symbol, Is.Null);
            Assert.That(binding.CandidateSymbols, Has.Length.EqualTo(2));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ReducedExtensionProofHintCannotBypassApplicableInstancePrecedence()
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(PreparedExtensionReceiver));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "ObserveInstance", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) };
            var result = PrepareAndRunSourceInstance(call, typeof(string), call, CallProofCompilation(), new[] { parameter }, _ => new object[] { new PreparedExtensionReceiver() }, value => (string)value, finalizeImports: true);
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("instance"));
            Assert.That(result.Actual.MethodKind, Is.EqualTo(MethodKind.Ordinary));
            Assert.That(result.Actual.IsExtensionMethod, Is.False);
            Assert.That(result.Actual.ReducedFrom, Is.Null);
            Assert.That(result.Selection?.Contract.IsReduced, Is.Not.True);
            Assert.That(result.Selection?.Contract.IsExtension, Is.Not.True);
        }
    }
}
