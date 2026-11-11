// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Text;
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
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void ConversionReturnReviewUsesEmittedTargetNotUnusedReturnMetadata(bool expressionBody, bool implicitOperator)
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var owner = new ConversionReturnOwner(creation, expressionBody, implicitOperator);
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var emitted = compilation.AddSyntaxTrees(tree);
            Assert.That(emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var declaration = tree.GetRoot().DescendantNodes().OfType<ConversionOperatorDeclarationSyntax>().Single();
            Assert.That(declaration.Type.ToString(), Does.Contain(nameof(PreparedConstructorProbe)));
            var syntax = tree.GetRoot().DescendantNodes().OfType<ImplicitObjectCreationExpressionSyntax>().Single();
            var actual = (IMethodSymbol)emitted.GetSemanticModel(tree).GetSymbolInfo(syntax).Symbol!;
            Assert.That(actual.ContainingType.Name, Is.EqualTo(nameof(PreparedConstructorProbe)));
            if (implicitOperator)
            {
                var selected = node.CallProofs?.Selection;
                Assert.That(selected, Is.Not.Null);
                Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual), Is.True);
                Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
                Assert.That(node.CallProofs!.ObservationAbsence, Is.Null);
            }
            else
            {
                Assert.That(owner.Methods.Single().Signature.ReturnType!.Name, Is.EqualTo(nameof(StringBuilder)), "This metadata is not the emitted explicit-conversion target.");
                Assert.That(node.CallProofs?.Selection, Is.Null);
                Assert.That(node.CallProofs?.ObservationAbsence, Is.Null, "Do not certify StringBuilder constructor absence for an emitted observing Probe construction.");
            }
            Assert.That(creation.Type, Is.Null);
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
        }

        private sealed class ConversionReturnOwner(NewInstanceExpression creation, bool expressionBody, bool implicitOperator) : TypeProvider
        {
            protected override string BuildName() => "ConversionReturnOwner";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "ConversionReturnOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override MethodProvider[] BuildMethods()
            {
                var target = new CSharpType(typeof(PreparedConstructorProbe));
                var signature = new MethodSignature(implicitOperator ? "unused" : "global::" + target.Namespace + "." + target.Name, null,
                    MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator |
                    (implicitOperator ? MethodSignatureModifiers.Implicit : MethodSignatureModifiers.Explicit),
                    implicitOperator ? target : typeof(StringBuilder), null,
                    new[] { new ParameterProvider("value", $"Source value.", Type, validation: ParameterValidationType.None) });
                return new[] { expressionBody ? new MethodProvider(signature, creation, this) : new MethodProvider(signature, Return(creation), this) };
            }
        }
    }
}
