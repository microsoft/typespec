// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
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
        [TestCase("metadata", false, false)]
        [TestCase("metadata", false, true)]
        [TestCase("metadata", true, false)]
        [TestCase("metadata", true, true)]
        [TestCase("source", false, false)]
        [TestCase("source", false, true)]
        [TestCase("source", true, false)]
        [TestCase("source", true, true)]
        public void LambdaBlockParameterProofUsesActualContextWithoutErasingParentCapture(string kind, bool text, bool overridden)
        {
            var compilation = LambdaGenericContextCompilation(kind);
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), text ? "LeafString" : "LeafInt", new ValueExpression[] { variable });
            var body = new MethodBodyStatements(new MethodBodyStatement[] { new ExpressionStatement(new KeywordExpression("return", child)) });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, body);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(kind == "metadata" ? (CSharpType)typeof(PreparedLambdaParameterProbe) : LoadedSourceCallType()), "Generic",
                overridden ? new ValueExpression[] { lambda, Literal("fixed") } : new ValueExpression[] { lambda })
            { TypeArguments = new CSharpType[] { text ? typeof(string) : typeof(int) } };
            var owner = FinalizeControlLambdaOwner(call, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var parent = GeneratedReviewCallOccurrence(prepared, call);
            var leaf = GeneratedReviewCallOccurrence(prepared, child);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var actual = EmitReducedWholeFile(compilation, output.Content, "Generic", Array.Empty<object>());
            var inputType = text ? SpecialType.System_String : SpecialType.System_Int32;
            Assert.That(actual.Method.TypeArguments.Single().SpecialType, Is.EqualTo(inputType));
            Assert.That(((INamedTypeSymbol)actual.Method.Parameters[0].Type).DelegateInvokeMethod!.Parameters[0].Type.SpecialType, Is.EqualTo(inputType));
            Assert.That(actual.Runtime, overridden ? Is.EqualTo("fixed") : Does.Contain(text ? "LeafString(x)" : "LeafInt(x)"));
            Assert.That(parent.CallProofs?.Selection, Is.Not.Null);
            Assert.That(leaf.CallProofs?.Selection, Is.Not.Null);
            var variableNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, variable));
            Assert.That(variableNode.ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(inputType));
            var captures = GraphItems(GraphFacts(prepared, variableNode), "EnclosingCaptures");
            Assert.That(captures.Count(c => Equals(GraphMember(c, "Observer"), parent.Id)), Is.EqualTo(overridden ? 0 : 1));
            Assert.That(captures.Count(c => Equals(GraphMember(c, "Observer"), leaf.Id)), Is.EqualTo(1), "The leaf's own omitted CAE remains independent of the parent's override.");
            Assert.That(captures.Length, Is.EqualTo(overridden ? 1 : 2));
            Assert.That(GraphItems(GraphFacts(prepared, variableNode), "EnclosingBarriers"), Is.Empty);
        }
    }
}
