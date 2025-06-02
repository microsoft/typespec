// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    public class RewriterTests
    {
        [Test]
        public async Task RewriterIsInvoked()
        {
            var invokeMethodExpression = new InvokeMethodExpression(This, "VisitsInvokeMethodExpression", []);
            var methods = new []
            {
                new MethodProvider(
                    new MethodSignature("VisitsInvokeMethodExpression", $"", MethodSignatureModifiers.Public, null, $"", []),
                    new[]
                    {
                        invokeMethodExpression.Terminate()
                    },
                    new TestTypeProvider())
            };
            var type = new TestTypeProvider(methods: methods);
            var outputLibrary = new TestOutputLibrary(type);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => outputLibrary,
                typesToKeep: ["TestName"]);

            mockGenerator.Object.AddRewriter(new TestRewriter());

            try
            {
                var csharpGen = new CSharpGen();
                await csharpGen.ExecuteAsync();

                await using var file =
                    File.Open(Path.Join(CodeModelGenerator.Instance.Configuration.OutputDirectory, "TestName.cs"),
                        FileMode.Open);
                var content = BinaryData.FromStream(file).ToString();
                Assert.AreEqual(Helpers.GetExpectedFromFile(), content);
            }
            finally
            {
                File.Delete(Path.Join(CodeModelGenerator.Instance.Configuration.OutputDirectory, "TestName.cs"));
            }
        }
    }

    public class TestOutputLibrary : OutputLibrary
    {
        public TestOutputLibrary(TypeProvider typeProvider)
        {
            TypeProviders = new List<TypeProvider> { typeProvider };
        }
        protected override TypeProvider[] BuildTypeProviders() => TypeProviders.ToArray();
    }

    public class TestRewriter : LibraryRewriter
    {
        public override SyntaxNode? VisitInvocationExpression(InvocationExpressionSyntax node)
        {
            if (node.Expression is MemberAccessExpressionSyntax)
            {
                var newMemberAccess = SyntaxFactory.InvocationExpression(
                    SyntaxFactory.IdentifierName("Foo"),
                    SyntaxFactory.ArgumentList().AddArguments(
                            SyntaxFactory.Argument(
                                SyntaxFactory.ParseExpression("\"bar\"")),
                            SyntaxFactory.Argument(
                                SyntaxFactory.ParseExpression("\"baz\""))));
                return newMemberAccess;
            }

            return base.VisitInvocationExpression(node);
        }
    }
}
