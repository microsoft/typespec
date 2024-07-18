// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Writers
{
    public class CodeWriterDeclarationTests
    {
        [Test]
        public void DeclarationTest()
        {
            var expr = Declare(new VariableExpression(typeof(int), "foo"), Literal(5));
            var ifStatement = new IfStatement(Literal(true)) { expr };
            var codeWriter = new CodeWriter();
            ifStatement.Write(codeWriter);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        [Test]
        public void DeclarationCanBeUsedTwice()
        {
            var declaration = new CodeWriterDeclaration("foo");
            var localFunctionStatement = new DeclareLocalFunctionStatement(declaration, Array.Empty<ParameterProvider>(), typeof(int), Literal(5));

            var codeWriter = new CodeWriter();
            localFunctionStatement.Write(codeWriter);
            codeWriter = new CodeWriter();
            localFunctionStatement = new DeclareLocalFunctionStatement(declaration, Array.Empty<ParameterProvider>(), typeof(int), Literal(5));
            localFunctionStatement.Write(codeWriter);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        [Test]
        [Ignore("https://github.com/microsoft/typespec/issues/3853")]
        public void AlreadyDeclaredVariableIsRenamedInScopeWithConflictingName()
        {
            var expr = Declare(new VariableExpression(typeof(int), "foo"), Literal(5));
            var usingExpr = new IfStatement(Literal(true)) { expr };
            var codeWriter = new CodeWriter();
            usingExpr.Write(codeWriter);

            var ifStatement = new IfStatement(Literal(true))
            {
                Declare(new VariableExpression(typeof(string), "foo"), Literal("bar")),
                expr
            };
            codeWriter = new CodeWriter();
            ifStatement.Write(codeWriter);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }
    }
}
