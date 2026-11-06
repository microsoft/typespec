// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void AnonymousConstructionReviewDoesNotBorrowObjectConstructor(bool field, bool nonempty)
        {
            var values = new Dictionary<ValueExpression, ValueExpression>();
            if (nonempty) { values.Add(new MemberExpression(null, "X"), Literal(1)); }
            var creation = new NewInstanceExpression(null, Array.Empty<ValueExpression>(), new ObjectInitializerExpression(values, UseSingleLine: true));
            var owner = new TargetTypedOwner(creation, new CSharpType[] { typeof(object) }, field);
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var emitted = compilation.AddSyntaxTrees(tree);
            Assert.That(emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var model = emitted.GetSemanticModel(tree);
            if (nonempty)
            {
                var syntax = tree.GetRoot().DescendantNodes().OfType<AnonymousObjectCreationExpressionSyntax>().Single();
                var type = (INamedTypeSymbol)model.GetTypeInfo(syntax).Type!;
                Assert.That(type.IsAnonymousType, Is.True);
                Assert.That(type.InstanceConstructors.Single().Parameters.Length, Is.EqualTo(1));
                Assert.That(node.CallProofs?.Selection, Is.Null, "Anonymous emission is not target-typed System.Object construction.");
                Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            }
            else
            {
                var syntax = tree.GetRoot().DescendantNodes().OfType<ImplicitObjectCreationExpressionSyntax>().Single();
                var constructor = (IMethodSymbol)model.GetSymbolInfo(syntax).Symbol!;
                Assert.That(constructor.ContainingType.SpecialType, Is.EqualTo(SpecialType.System_Object));
                Assert.That(node.CallProofs?.Selection, Is.Not.Null);
                Assert.That(SymbolEqualityComparer.Default.Equals(node.CallProofs!.Selection!.Contract.DeclarationSymbol, constructor), Is.True);
                Assert.That(node.CallProofs.ObservationAbsence, Is.Not.Null);
            }
            Assert.That(creation.Type, Is.Null);
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
        }

        [Test]
        public void AnonymousConstructionReviewUnknownInitializerDoesNotInspectCount()
        {
            var creation = new NewInstanceExpression(null, Array.Empty<ValueExpression>(), new ObjectInitializerExpression(new SourceOpaqueDictionary(), UseSingleLine: true));
            var owner = new TargetTypedOwner(creation, new CSharpType[] { typeof(object) });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void AnonymousConstructionReviewInitializerMutationCannotReviveTargetTypedCertificate()
        {
            var values = new Dictionary<ValueExpression, ValueExpression>();
            var creation = new NewInstanceExpression(null, Array.Empty<ValueExpression>(), new ObjectInitializerExpression(values, UseSingleLine: true));
            var owner = new TargetTypedOwner(creation, new CSharpType[] { typeof(object) });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var key = new MemberExpression(null, "X");
            values.Add(key, Literal(1));
            Assert.That(held!.IsCurrent, Is.False);
            values.Remove(key);
            Assert.That(held.IsCurrent, Is.False);
        }
    }
}
