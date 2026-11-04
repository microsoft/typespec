// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
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
        public void LambdaParameterBoundaryNamedArgumentUsesFormalOrdinal()
        {
            var declaration = new CodeWriterDeclaration("x");
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt",
                new ValueExpression[] { new VariableExpression(typeof(Uri), declaration) });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "Named", new ValueExpression[]
            { new PositionalParameterReferenceExpression("callback", lambda), new PositionalParameterReferenceExpression("value", Literal(1)) });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "Named", Array.Empty<object>()).Runtime, Does.Contain("LeafInt(x)"));
            Assert.That(parentNode.CallProofs?.Selection, Is.Not.Null);
            Assert.That(parentNode.CallProofs!.Selection!.Arguments.Parameters[1].EvaluationIndex, Is.EqualTo(0));
            Assert.That(GeneratedReviewCallOccurrence(prepared, child).CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void LambdaParameterBoundarySharedLambdaHasDistinctOccurrenceTypes()
        {
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { variable });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "Pair", new ValueExpression[] { lambda, lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Where(n => ReferenceEquals(n.Producer, variable)).OrderBy(n => n.Id.EdgePath, StringComparer.Ordinal).ToArray();
            Assert.That(nodes, Has.Length.EqualTo(2));
            Assert.That(nodes[0].ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(nodes[1].ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_String));
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "Pair", Array.Empty<object>()).Runtime, Is.EqualTo("pair"));
            Assert.That(GeneratedReviewCallOccurrence(prepared, parent).CallProofs?.Selection, Is.Not.Null);
            Assert.That(nodes[0].ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(nodes[1].ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_String));
        }

        [Test]
        public void LambdaParameterBoundaryForeignSignatureCannotSupplyParameterType()
        {
            var declaration = new CodeWriterDeclaration("x");
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt",
                new ValueExpression[] { new VariableExpression(typeof(Uri), declaration) });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var signature = new MethodSignature("SafeInt", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, typeof(string), null,
                new[] { new ParameterProvider("callback", $"foreign intent", typeof(Func<Uri, string>)) });
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), signature, new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "SafeInt", Array.Empty<object>()).Runtime, Is.EqualTo("safe"));
            Assert.That(GeneratedReviewCallOccurrence(prepared, child).CallProofs?.Selection, Is.Not.Null);
            Assert.That(GeneratedReviewCallOccurrence(prepared, parent).CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void LambdaParameterBoundaryMultipleCandidatesDoNotProvideSpeculativeContext()
        {
            var declaration = new CodeWriterDeclaration("x");
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt",
                new ValueExpression[] { new VariableExpression(typeof(int), declaration) });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, child);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "Overloaded", new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "Overloaded", Array.Empty<object>()).Runtime, Is.EqualTo("int"));
            Assert.That(GeneratedReviewCallOccurrence(prepared, parent).CallProofs?.Selection, Is.Null);
            Assert.That(GeneratedReviewCallOccurrence(prepared, child).CallProofs?.Selection, Is.Null);
        }

        [TestCase("foreign")]
        [TestCase("duplicate")]
        [TestCase("discard")]
        public void LambdaParameterBoundaryRejectsUnprovedDeclarationOwnership(string kind)
        {
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(int), kind == "foreign" ? new CodeWriterDeclaration("x") : declaration);
            ValueExpression body = kind == "discard" ? Literal("text") : new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt", new ValueExpression[] { variable });
            var lambda = new FuncExpression(kind == "duplicate" ? new CodeWriterDeclaration?[] { declaration, declaration } :
                kind == "discard" ? new CodeWriterDeclaration?[] { null } : new CodeWriterDeclaration?[] { declaration }, body);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), kind == "duplicate" ? "SafeMixed" : "SafeInt", new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, parent);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var errors = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Length == 0, Is.EqualTo(kind == "discard"), output.Content);
            if (kind == "discard") { Assert.That(EmitReducedWholeFile(CallProofCompilation(), output.Content, "SafeInt", Array.Empty<object>()).Runtime, Is.EqualTo("safe")); }
            Assert.That(node.CallProofs?.Selection, Is.Null);
        }

        [TestCase("name")]
        [TestCase("parameters")]
        [TestCase("arguments")]
        [TestCase("parent")]
        public void LambdaParameterBoundaryContextInvalidationIsSticky(string change)
        {
            var declaration = new CodeWriterDeclaration("x");
            var parameters = new List<CodeWriterDeclaration?> { declaration };
            var variable = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt", new ValueExpression[] { variable });
            var lambda = new FuncExpression(parameters, child);
            var arguments = new List<ValueExpression> { lambda };
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "SafeInt", arguments);
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            var variableNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, variable));
            var selected = childNode.CallProofs?.Selection;
            Assert.That(selected?.IsCurrent, Is.True);
            Assert.That(variableNode.ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            switch (change)
            {
                case "name": declaration.Update(name: "changed"); break;
                case "parameters": parameters[0] = new CodeWriterDeclaration("other"); break;
                case "arguments": arguments[0] = Literal("wrong"); break;
                default: parent.MethodName = "SafeString"; break;
            }
            Assert.That(selected!.IsCurrent, Is.False);
            Assert.That(variableNode.ResolveContextualParameterType(variable), Is.Null);
            switch (change)
            {
                case "name": declaration.Update(name: "x"); break;
                case "parameters": parameters[0] = declaration; break;
                case "arguments": arguments[0] = lambda; break;
                default: parent.MethodName = "SafeInt"; break;
            }
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(variableNode.ResolveContextualParameterType(variable), Is.Null);
        }
    }
}
