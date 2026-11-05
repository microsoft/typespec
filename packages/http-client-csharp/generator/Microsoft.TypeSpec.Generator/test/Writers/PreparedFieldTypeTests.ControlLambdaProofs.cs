// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
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
        [TestCase("if", false, false)]
        [TestCase("if-else", false, false)]
        [TestCase("while", false, false)]
        [TestCase("do-while", false, false)]
        [TestCase("if", true, false)]
        [TestCase("if-else", true, false)]
        [TestCase("while", true, false)]
        [TestCase("do-while", true, false)]
        [TestCase("if", true, true)]
        [TestCase("if-else", true, true)]
        [TestCase("while", true, true)]
        [TestCase("do-while", true, true)]
        public void ControlLambdaProofUsesActualFormalAndBoundedReturnPaths(string kind, bool safeParent, bool reducedChild)
        {
            var parameter = new ParameterProvider("p", $"value", typeof(int));
            var guard = new ParameterProvider("guard", $"condition", typeof(bool));
            var child = reducedChild
                ? new InvokeMethodExpression(parameter.AsVariable(), "ObserveReceiver", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) }
                : new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), ControlParameterBody(kind, guard.AsVariable(), child));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), safeParent ? "Safe" : "Observe", new ValueExpression[] { closure });
            var owner = new ParameterValueOwner(parent, new[] { parameter, guard });
            owner.EnsureBuilt();
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            FinalizeGeneratedCallFixture(owner);
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            var selected = parentNode.CallProofs?.Selection;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(compilation, output.Content, safeParent ? "Safe" : "Observe", new object[] { 1, true });
            if (safeParent) { Assert.That(actual.Runtime, Is.EqualTo("safe")); }
            else { Assert.That(actual.Runtime, Does.Contain(kind is "if" or "if-else" ? "if (guard)" : "while (guard)")); }
            Assert.That(selected, Is.Not.Null);
            Assert.That(parentNode.CallProofs?.ObservationAbsence is not null, Is.EqualTo(safeParent));
            Assert.That(childNode.CallProofs?.Selection, Is.Not.Null);
            var facts = prepared.SourceFiles.Single().Observations!.GetCurrent(childNode);
            Assert.That(facts, Is.Not.Null);
            Assert.That(facts!.EnclosingCaptures, Has.Length.EqualTo(safeParent ? 0 : 1));
            Assert.That(facts.EnclosingBarriers, Is.Empty);
            Assert.That(facts.OwnCaptures, Has.Length.EqualTo(1));
        }
    }
}
