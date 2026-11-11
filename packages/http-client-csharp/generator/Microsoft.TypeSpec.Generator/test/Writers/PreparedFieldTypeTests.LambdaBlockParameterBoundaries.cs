// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
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
        [Test]
        public void LambdaBlockParameterBoundarySharedBlockHasOccurrenceLocalNativeTypesAfterWriting()
        {
            var compilation = LambdaGenericContextCompilation("metadata");
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { variable });
            var body = new MethodBodyStatements(new MethodBodyStatement[] { new ExpressionStatement(new KeywordExpression("return", child)) });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, body);
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "Pair", new ValueExpression[] { lambda, lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            // Establish native compilation, operation/formal evidence, emission and runtime before prepared claims.
            var actual = EmitReducedWholeFile(compilation, output.Content, "Pair", Array.Empty<object>());
            Assert.That(actual.Runtime, Is.EqualTo("pair"));
            Assert.That(actual.Method.Parameters.Select(p => ((INamedTypeSymbol)p.Type).DelegateInvokeMethod!.Parameters[0].Type.SpecialType),
                Is.EqualTo(new[] { SpecialType.System_Int32, SpecialType.System_String }));
            AssertBlockBoundaryNativeParameters(compilation, output.Content, SpecialType.System_Int32, SpecialType.System_String);

            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Where(n => ReferenceEquals(n.Producer, variable))
                .OrderBy(n => n.Id.EdgePath, StringComparer.Ordinal).ToArray();
            Assert.That(nodes, Has.Length.EqualTo(2));
            Assert.That(nodes[0].ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            Assert.That(nodes[1].ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_String));
            Assert.That(variable.Type, Is.EqualTo((CSharpType)typeof(Uri)), "Context must not become a global IR type annotation.");
            Assert.That(GeneratedReviewCallOccurrence(prepared, parent).CallProofs?.Selection, Is.Not.Null);
            var children = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Where(n => ReferenceEquals(n.Producer, child)).ToArray();
            Assert.That(children, Has.Length.EqualTo(2));
            Assert.That(children.All(n => n.CallProofs?.Selection is not null), Is.True);
        }

        [TestCase("opaque-body")]
        [TestCase("native-other-return")]
        public void LambdaBlockParameterBoundaryRetainedStatementListStalenessIsSticky(string change)
        {
            var compilation = LambdaGenericContextCompilation("metadata");
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(Uri), declaration);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt", new ValueExpression[] { variable });
            var ownedReturn = new ExpressionStatement(new KeywordExpression("return", child));
            var statements = new List<MethodBodyStatement> { ownedReturn };
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, new MethodBodyStatements(statements));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "ObserveInt", new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            var callbacks = 0;
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var actual = EmitReducedWholeFile(compilation, output.Content, "ObserveInt", Array.Empty<object>());
            Assert.That(actual.Runtime, Does.Contain("LeafInt(x)"));
            AssertBlockBoundaryNativeParameters(compilation, output.Content, SpecialType.System_Int32);
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);

            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            var variableNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, variable));
            var selected = childNode.CallProofs?.Selection ?? throw new InvalidOperationException("Expected initial child selection.");
            var graph = GraphFacts(prepared, variableNode);
            Assert.That(selected.IsCurrent, Is.True);
            Assert.That(GraphMember(graph, "IsCurrent"), Is.True);
            Assert.That(variableNode.ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var captures = GraphItems(graph, "EnclosingCaptures");
            Assert.That(captures.Count(c => Equals(GraphMember(c, "Observer"), parentNode.Id)), Is.EqualTo(1));
            Assert.That(captures.Count(c => Equals(GraphMember(c, "Observer"), childNode.Id)), Is.EqualTo(1));
            Assert.That(captures, Has.Length.EqualTo(2));
            ValueExpression replacement = change == "opaque-body"
                ? new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("\"opaque\""); }) : Literal("other");
            statements[0] = new ExpressionStatement(new KeywordExpression("return", replacement));
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(variableNode.ResolveContextualParameterType(variable), Is.Null);
            Assert.That(GraphMember(graph, "IsCurrent"), Is.False);
            statements[0] = ownedReturn;
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(variableNode.ResolveContextualParameterType(variable), Is.Null);
            Assert.That(GraphMember(graph, "IsCurrent"), Is.False);
            Assert.That(callbacks, Is.Zero, "Currentness checks must not execute an opaque callback.");
        }

        [Test]
        public void LambdaBlockParameterBoundaryOpaqueReturnIsValidButDoesNotAuthorizeContext()
        {
            var compilation = LambdaGenericContextCompilation("metadata");
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(int), declaration);
            var callbacks = 0;
            // Action<CodeWriter>, not a structured expression with an innocuous callback beside it.
            var opaque = new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("x.ToString()"); });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, new MethodBodyStatements(new MethodBodyStatement[]
            { new ExpressionStatement(new KeywordExpression("return", opaque)) }));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "ObserveInt", new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            Assert.That(callbacks, Is.Zero);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            var actual = EmitReducedWholeFile(compilation, output.Content, "ObserveInt", Array.Empty<object>());
            Assert.That(actual.Runtime, Does.Contain("return x.ToString();"));
            AssertBlockBoundaryNativeParameters(compilation, output.Content, SpecialType.System_Int32);

            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var lambdaNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, lambda));
            Assert.That(parentNode.CallProofs?.Selection, Is.Null);
            Assert.That(parentNode.CallProofs?.ObservationAbsence, Is.Null);
            Assert.That(lambdaNode.ResolveContextualParameterType(variable), Is.Null);
            Assert.That(GraphItems(GraphFacts(prepared, lambdaNode), "EnclosingBarriers"), Is.Not.Empty);
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void LambdaBlockParameterBoundaryOwnedLocalBeforeReturnRemainsUnsupported()
        {
            var compilation = LambdaGenericContextCompilation("metadata");
            var declaration = new CodeWriterDeclaration("x");
            var parameterVariable = new VariableExpression(typeof(int), declaration);
            var localDeclaration = Declare("local", typeof(int), Literal(1), out var local);
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "LeafInt", new ValueExpression[] { local });
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, new MethodBodyStatements(new MethodBodyStatement[]
            { localDeclaration, new ExpressionStatement(new KeywordExpression("return", child)) }));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "ObserveInt", new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var actual = EmitReducedWholeFile(compilation, output.Content, "ObserveInt", Array.Empty<object>());
            Assert.That(actual.Runtime, Does.Contain("LeafInt(local)"));
            AssertBlockBoundaryNativeParameters(compilation, output.Content, SpecialType.System_Int32);
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var native = compilation.AddSyntaxTrees(tree);
            var localSyntax = tree.GetRoot().DescendantNodes().OfType<VariableDeclaratorSyntax>().Single(v => v.Identifier.ValueText == "local");
            var localSymbol = native.GetSemanticModel(tree).GetDeclaredSymbol(localSyntax) as ILocalSymbol
                ?? throw new InvalidOperationException("Expected an actual owned local declaration.");
            Assert.That(localSymbol.Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));

            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var parentNode = GeneratedReviewCallOccurrence(prepared, parent);
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            var lambdaNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, lambda));
            Assert.That(parentNode.CallProofs?.Selection, Is.Null);
            Assert.That(parentNode.CallProofs?.ObservationAbsence, Is.Null);
            Assert.That(childNode.CallProofs?.Selection, Is.Null, "A local's IR Type is not declaration evidence.");
            Assert.That(lambdaNode.ResolveContextualParameterType(parameterVariable), Is.Null);
            Assert.That(childNode.ResolveContextualParameterType(local), Is.Null);
            Assert.That(GraphItems(GraphFacts(prepared, childNode), "EnclosingBarriers"), Is.Not.Empty);
        }

        [Test]
        public void LambdaBlockParameterBoundaryNativeWrongReturnDoesNotConflateContextWithApplicability()
        {
            var compilation = LambdaGenericContextCompilation("metadata");
            var declaration = new CodeWriterDeclaration("x");
            var variable = new VariableExpression(typeof(Uri), declaration);
            var lambda = new FuncExpression(new CodeWriterDeclaration?[] { declaration }, new MethodBodyStatements(new MethodBodyStatement[]
            { new ExpressionStatement(new KeywordExpression("return", variable)) }));
            var parent = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaParameterProbe)), "ObserveInt", new ValueExpression[] { lambda });
            var owner = FinalizeControlLambdaOwner(parent, Array.Empty<ParameterProvider>());
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var native = compilation.AddSyntaxTrees(tree);
            var errors = native.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Any(d => d.Id == "CS0029"), Is.True, string.Join("\n", errors.Select(d => d.ToString())));
            var syntax = tree.GetRoot().DescendantNodes().OfType<LambdaExpressionSyntax>().Single();
            var operation = native.GetSemanticModel(tree).GetOperation(syntax) as IAnonymousFunctionOperation
                ?? throw new InvalidOperationException("Expected native lambda operation even for a wrong return.");
            Assert.That(operation.Symbol.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));

            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(GeneratedReviewCallOccurrence(prepared, parent).CallProofs?.Selection, Is.Null);
            var variableNode = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, variable));
            Assert.That(variableNode.ResolveContextualParameterType(variable)!.SpecialType, Is.EqualTo(SpecialType.System_Int32),
                "Lexical native parameter evidence is not a successful return conversion or parent selection.");
            Assert.That(variable.Type, Is.EqualTo((CSharpType)typeof(Uri)));
        }

        private static void AssertBlockBoundaryNativeParameters(CSharpCompilation compilation, string output, params SpecialType[] expected)
        {
            var tree = CSharpSyntaxTree.ParseText(output);
            var native = compilation.AddSyntaxTrees(tree);
            Assert.That(native.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output);
            var model = native.GetSemanticModel(tree);
            var lambdas = tree.GetRoot().DescendantNodes().OfType<LambdaExpressionSyntax>().ToArray();
            Assert.That(lambdas, Has.Length.EqualTo(expected.Length));
            for (var index = 0; index < lambdas.Length; index++)
            {
                var syntax = lambdas[index];
                Assert.That(syntax.Body, Is.InstanceOf<BlockSyntax>());
                var operation = model.GetOperation(syntax) as IAnonymousFunctionOperation
                    ?? throw new InvalidOperationException("Expected native block lambda operation.");
                var converted = model.GetTypeInfo(syntax).ConvertedType as INamedTypeSymbol
                    ?? throw new InvalidOperationException("Expected native converted delegate type.");
                var invoke = converted.DelegateInvokeMethod ?? throw new InvalidOperationException("Expected native delegate Invoke.");
                Assert.That(operation.Symbol.Parameters.Single().Type.SpecialType, Is.EqualTo(expected[index]));
                Assert.That(invoke.Parameters.Single().Type.SpecialType, Is.EqualTo(expected[index]));
                Assert.That(invoke.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_String));
                // Also bind every emitted reference to the actual lambda parameter, after writer name binding.
                foreach (var identifier in syntax.Body.DescendantNodes().OfType<IdentifierNameSyntax>())
                {
                    if (model.GetOperation(identifier) is IParameterReferenceOperation reference)
                    {
                        Assert.That(SymbolEqualityComparer.Default.Equals(reference.Parameter, operation.Symbol.Parameters.Single()), Is.True);
                        Assert.That(reference.Type!.SpecialType, Is.EqualTo(expected[index]));
                    }
                }
            }
        }
    }
}
