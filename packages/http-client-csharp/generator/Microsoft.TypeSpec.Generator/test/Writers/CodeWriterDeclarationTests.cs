// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    public class CodeWriterDeclarationTests
    {
        public CodeWriterDeclarationTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void DeclarationTest()
        {
            var expr = Declare(new VariableExpression(typeof(int), "foo"), Literal(5));
            var ifStatement = new IfStatement(Literal(true)) { expr };
            using var codeWriter = new CodeWriter();
            ifStatement.Write(codeWriter);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        [Test]
        public void DeclarationCanBeUsedTwice()
        {
            var declaration = new CodeWriterDeclaration("foo");
            var localFunctionStatement = new DeclareLocalFunctionStatement(declaration, Array.Empty<ParameterProvider>(), typeof(int), Literal(5));

            using var codeWriter = new CodeWriter();
            localFunctionStatement.Write(codeWriter);
            using var codeWriter2 = new CodeWriter();
            localFunctionStatement = new DeclareLocalFunctionStatement(declaration, Array.Empty<ParameterProvider>(), typeof(int), Literal(5));
            localFunctionStatement.Write(codeWriter2);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter2.ToString(false));
        }

        [Test]
        public void AlreadyDeclaredVariableIsRenamedInScopeWithConflictingName()
        {
            var expr = Declare(new VariableExpression(typeof(int), "foo"), Literal(5));
            var usingExpr = new IfStatement(Literal(true))
            {
                expr
            };
            using var codeWriter = new CodeWriter();
            usingExpr.Write(codeWriter);
            Assert.AreEqual(Helpers.GetExpectedFromFile("first"), codeWriter.ToString(false));

            var ifStatement = new IfStatement(Literal(true))
            {
                Declare(new VariableExpression(typeof(string), "foo"), Literal("bar")),
                expr
            };
            using var codeWriter2 = new CodeWriter();
            ifStatement.Write(codeWriter2);
            Assert.AreEqual(Helpers.GetExpectedFromFile("second"), codeWriter2.ToString(false));
        }

        [Test]
        public void ScopeStoredOnceInSameBlock()
        {
            var declaration = new CodeWriterDeclaration("foo");
            var fooVariable = new VariableExpression(typeof(int), declaration);
            var block = new IfStatement(Literal(true))
            {
                Declare(fooVariable, Literal(1)),
                fooVariable.Assign(Literal(1)).Terminate()
            };
            using var codeWriter = new CodeWriter();
            block.Write(codeWriter);
            var declScopes = GetDeclarationScopes(declaration);
            Assert.AreEqual(1, declScopes.Count);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        [Test]
        public void ScopeStoredTwiceInMultipleBlock()
        {
            var declaration = new CodeWriterDeclaration("foo");
            var fooVariable = new VariableExpression(typeof(int), declaration);
            var block = new IfStatement(Literal(true))
            {
                Declare(fooVariable, Literal(1)),
            };
            var block2 = new IfStatement(Literal(true))
            {
                Declare(fooVariable, Literal(1)),
            };
            using var codeWriter = new CodeWriter();
            block.Write(codeWriter);
            block2.Write(codeWriter);
            var declScopes = GetDeclarationScopes(declaration);
            Assert.AreEqual(2, declScopes.Count);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        [Test]
        public void ScopeStoredTwiceInNestedBlock()
        {
            var declaration = new CodeWriterDeclaration("foo");
            var fooVariable = new VariableExpression(typeof(int), declaration);
            var block = new IfStatement(Literal(true))
            {
                Declare(fooVariable, Literal(1)),
                new IfStatement(Literal(true))
                {
                    fooVariable.Assign(Literal(1)).Terminate(),
                }
            };
            using var codeWriter = new CodeWriter();
            block.Write(codeWriter);
            var declScopes = GetDeclarationScopes(declaration);
            Assert.AreEqual(2, declScopes.Count);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        [Test]
        public void ScopeStoredTwiceInSkippedNestedBlock()
        {
            var declaration = new CodeWriterDeclaration("foo");
            var fooVariable = new VariableExpression(typeof(int), declaration);
            var block = new IfStatement(Literal(true))
            {
                Declare(fooVariable, Literal(1)),
                new IfStatement(Literal(true))
                {
                    new IfStatement(Literal(true))
                    {
                        fooVariable.Assign(Literal(1)).Terminate(),
                    }
                }
            };
            using var codeWriter = new CodeWriter();
            block.Write(codeWriter);
            var declScopes = GetDeclarationScopes(declaration);
            Assert.AreEqual(2, declScopes.Count);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        [Test]
        public void ScopeDeclaredTwiceForMethodSignatureParam()
        {
            var type = new TestTypeProvider();
            var param = new ParameterProvider("foo", $"foo", typeof(string)) { Validation = ParameterValidationType.AssertNotNull };
            var signature = new MethodSignature("TestMethod", null, MethodSignatureModifiers.Public, null, null, [param]);
            var method = new MethodProvider(
                signature,
                param.Assign(Literal("foo")).Terminate(),
                type,
                new XmlDocProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteMethod(method);
            var declScopes = GetDeclarationScopes(param.AsExpression().Declaration);
            Assert.AreEqual(2, declScopes.Count);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeWriter.ToString(false));
        }

        private Dictionary<CodeWriter.CodeScope, string> GetDeclarationScopes(CodeWriterDeclaration declaration)
        {
            var namesDictionaryField = typeof(CodeWriterDeclaration).GetField("_actualNames", BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.IsNotNull(namesDictionaryField);
            var namesDictionary = namesDictionaryField!.GetValue(declaration) as Dictionary<CodeWriter.CodeScope, string>;
            Assert.IsNotNull(namesDictionary);
            return namesDictionary!;
        }
    }
}
