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
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
{
    public partial class NamedTypeSymbolProviderTests
    {
        [Test]
        public void DeclaredMapsRecognizeScopedReorderedNamedArguments()
        {
            var compilation = ContractCompilation();
            var api = compilation.GetTypeByMetadataName("Contracts.Api")!;
            var method = api.GetMembers("Capture").OfType<IMethodSymbol>().Single();
            var contract = DeclaredCallableContract.FromSymbol(method, compilation);
            var first = Literal(1);
            var second = Literal(2);
            ValueExpression[] arguments =
            [
                PositionalReference("second", second).As(typeof(object)),
                PositionalReference("first", first).As(typeof(object))
            ];
            var map = DeclaredArgumentMap.Create(contract, arguments);
            using var writer = new CodeWriter();
            writer.WriteArguments(arguments);
            var code = writer.ToString();

            Assert.That(code, Does.Contain("second: 2"));
            Assert.That(code, Does.Contain("first: 1"));
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 1, 0 }));
            Assert.That(map.Parameters[0].Value, Is.SameAs(first));
            Assert.That(map.Parameters[1].Value, Is.SameAs(second));
            Assert.That(map.IsCurrent(), Is.True);
        }

        [Test]
        public void DeclaredMapsRecognizeScopedRefOutInArguments()
        {
            var compilation = ContractCompilation();
            var method = compilation.GetTypeByMetadataName("Contracts.Api")!.GetMembers("Ref").OfType<IMethodSymbol>().Single();
            var contract = DeclaredCallableContract.FromSymbol(method, compilation);
            ValueExpression[] values =
            [
                new VariableExpression(typeof(int), new CodeWriterDeclaration("first")),
                new VariableExpression(typeof(int), new CodeWriterDeclaration("second")),
                new VariableExpression(typeof(int), new CodeWriterDeclaration("third"))
            ];
            var inArgument = new ArgumentExpression(values[2]);
            inArgument.Update(isIn: true);
            ValueExpression[] arguments =
            [
                new ArgumentExpression(values[0], IsRef: true).As(typeof(int)),
                new ArgumentExpression(values[1], IsOut: true).As(typeof(int)),
                inArgument.As(typeof(int))
            ];
            var map = DeclaredArgumentMap.Create(contract, arguments);
            using var writer = new CodeWriter();
            writer.WriteArguments(arguments);
            var code = writer.ToString();

            Assert.That(code, Does.Contain("ref first"));
            Assert.That(code, Does.Contain("out second"));
            Assert.That(code, Does.Contain("in third"));
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.EvaluationOrder.Select(a => a.Modifier), Is.EqualTo(new[] { RefKind.Ref, RefKind.Out, RefKind.In }));
            Assert.That(map.EvaluationOrder.Select(a => a.Value), Is.EqualTo(values));
        }

        [TestCase("argument", false)]
        [TestCase("argument", true)]
        [TestCase("named", false)]
        [TestCase("named", true)]
        [TestCase("type", false)]
        [TestCase("type", true)]
        public void SymbolBackedAttributeProjectionMutationInvalidatesContract(string change, bool materializeFirst)
        {
            var compilation = ContractCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("""
                namespace ReviewContracts
                {
                    public sealed class TagAttribute : System.Attribute
                    {
                        public TagAttribute(string value) { }
                        public string Text { get; set; }
                    }
                    public static class Api
                    {
                        public static void M([Tag("original", Text = "before")] object value) { }
                    }
                }
                """));
            var symbol = compilation.GetTypeByMetadataName("ReviewContracts.Api")!.GetMembers("M").OfType<IMethodSymbol>().Single();
            var attribute = new AttributeStatement(symbol.Parameters[0].GetAttributes().Single());
            if (materializeFirst)
            {
                _ = attribute.Type;
                _ = attribute.Arguments;
                _ = attribute.PositionalArguments;
            }
            var parameter = new ParameterProvider("value", $"", typeof(object), attributes: new[] { attribute });
            var signature = new MethodSignature("M", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                null, null, new[] { parameter });
            var contract = DeclaredCallableContract.FromSignature(signature, compilation);
            Assert.That(contract.IsAvailable, Is.True, contract.UnavailableReason);
            _ = attribute.Type;
            _ = attribute.Arguments;
            _ = attribute.PositionalArguments;
            Assert.That(contract.IsCurrent(), Is.True, "Canonical lazy materialization is not mutation.");
            Action restore;
            switch (change)
            {
                case "argument":
                    var arguments = (IList<ValueExpression>)attribute.Arguments!;
                    var oldArgument = arguments[0];
                    arguments[0] = Literal("changed");
                    restore = () => arguments[0] = oldArgument;
                    break;
                case "named":
                    var named = (IList<KeyValuePair<string, ValueExpression>>)attribute.PositionalArguments!;
                    var oldNamed = named[0];
                    named[0] = new(oldNamed.Key, Literal("after"));
                    restore = () => named[0] = oldNamed;
                    break;
                default:
                    var oldNamespace = attribute.Type.Namespace;
                    attribute.Type.Namespace = "Other";
                    restore = () => attribute.Type.Namespace = oldNamespace;
                    break;
            }
            Assert.That(contract.IsCurrent(), Is.False, "Emitted projection changes cannot hide behind immutable original AttributeData.");
            restore();
            Assert.That(contract.IsCurrent(), Is.False, "Observed divergence must remain sticky after restoration.");
        }

        [TestCase("argument")]
        [TestCase("keyword")]
        [TestCase("scoped")]
        public void VisitorMutationOfRetainedReplacementInvalidatesDeclaredMap(string kind)
        {
            var compilation = ContractCompilation();
            var method = compilation.GetTypeByMetadataName("Contracts.Api")!.GetMembers("Capture").OfType<IMethodSymbol>().Single();
            var contract = DeclaredCallableContract.FromSymbol(method, compilation);
            var oldCall = new InvokeMethodExpression(null, "Old", []);
            var newCall = new InvokeMethodExpression(null, "New", []);
            ValueExpression Wrapper(ValueExpression child) => kind switch
            {
                "argument" => new ArgumentExpression(child),
                "keyword" => new KeywordExpression("await", child),
                _ => child.As(typeof(object))
            };
            var retained = Wrapper(oldCall);
            var visited = Wrapper(oldCall);
            var map = DeclaredArgumentMap.Create(contract, new[] { retained });
            Assert.That(map.IsAvailable, Is.True, map.UnavailableReason);
            Assert.That(map.IsCurrent(), Is.True);
            var visitor = new ReplacementWrapperVisitor(retained, newCall);
            Assert.That(visited.Accept(visitor, null!), Is.SameAs(retained));
            using var writer = new CodeWriter();
            retained.Write(writer);
            Assert.That(writer.ToString(), Does.Contain("New("));
            Assert.That(map.IsCurrent(), Is.False, "The actual returned wrapper/child changed, not the originally visited wrapper.");
        }

        private sealed class ReplacementWrapperVisitor(ValueExpression replacement, InvokeMethodExpression call) : LibraryVisitor
        {
            protected internal override ValueExpression? VisitArgumentExpression(ArgumentExpression expression, MethodProvider method) => replacement;
            protected internal override ValueExpression? VisitKeywordExpression(KeywordExpression expression, MethodProvider method) => replacement;
            protected internal override ValueExpression? VisitScopedApiExpression(ScopedApi expression, MethodProvider method) => replacement;
            protected internal override ValueExpression? VisitInvokeMethodExpression(InvokeMethodExpression expression, MethodProvider method) => call;
        }
    }
}
