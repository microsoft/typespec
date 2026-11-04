// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase("ObserveInt", false, false)]
        [TestCase("SafeInt", true, false)]
        [TestCase("ObserveString", false, true)]
        [TestCase("SafeString", true, true)]
        [TestCase("SafeMixed", true, true)]
        public void LambdaParameterProofUsesActualContextualFormalNotAdvertisedType(string name, bool safe, bool text)
        {
            var mixed = name == "SafeMixed";
            var first = new CodeWriterDeclaration("x");
            var second = new CodeWriterDeclaration("y");
            var declaration = mixed ? second : first;
            var argument = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), text ? "LeafString" : "LeafInt", new ValueExpression[] { argument });
            var closure = new FuncExpression(mixed ? new CodeWriterDeclaration?[] { first, second } : new CodeWriterDeclaration?[] { first }, child);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), name, new ValueExpression[] { closure });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            var selected = parentNode.CallProofs?.Selection;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(compilation, output.Content, name, Array.Empty<object>());
            if (safe) { Assert.That(actual.Runtime, Is.EqualTo("safe")); }
            else { Assert.That(actual.Runtime, Does.Contain(text ? "LeafString(x)" : "LeafInt(x)")); }
            var invoke = ((INamedTypeSymbol)actual.Method.Parameters[0].Type).DelegateInvokeMethod!;
            Assert.That(invoke.Parameters[mixed ? 1 : 0].Type.SpecialType, Is.EqualTo(text ? SpecialType.System_String : SpecialType.System_Int32));
            Assert.That(selected, Is.Not.Null);
            Assert.That(parentNode.CallProofs?.ObservationAbsence is not null, Is.EqualTo(safe));
            Assert.That(childNode.CallProofs?.Selection, Is.Not.Null);
            Assert.That(childNode.CallProofs!.Selection!.Arguments.Parameters[0].Value, Is.SameAs(argument));
            var facts = prepared.SourceFiles.Single().Observations!.GetCurrent(childNode);
            Assert.That(facts, Is.Not.Null);
            Assert.That(facts!.OwnCaptures, Has.Length.EqualTo(1));
            Assert.That(facts.EnclosingCaptures, Has.Length.EqualTo(safe ? 0 : 1));
        }
    }
}
