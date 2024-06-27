// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using Moq;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Statements
{
    public class StatementTests
    {
        private readonly string _mocksFolder = "Mocks";

        [OneTimeSetUp]
        public void Setup()
        {
            string outputFolder = "./outputFolder";
            string projectPath = outputFolder;
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the singleton instance of the plugin
            _ = new MockCodeModelPlugin(new GeneratorContext(Configuration.Load(configFilePath)));
        }

        [Test]
        public void CreateForStatement()
        {
            var assignment = new AssignmentExpression(new DeclarationExpression(new CSharpType(typeof(BinaryData)), "responseParamName"), new ValueExpression());
            var condition = new BoolSnippet(BoolSnippet.True);
            var increment = new ValueExpression();
            var forStatement = new ForStatement(assignment, condition, increment);

            Assert.NotNull(forStatement);
            Assert.IsEmpty(forStatement.Body);
        }

        [Test]
        public void ForStatementWithAddMethod()
        {
            var assignment = new AssignmentExpression(new DeclarationExpression(new CSharpType(typeof(BinaryData)), "responseParamName"), new ValueExpression());
            var condition = new BoolSnippet(BoolSnippet.True);
            var increment = new ValueExpression();
            var forStatement = new ForStatement(assignment, condition, increment);
            var statementToAdd = new MethodBodyStatement();

            forStatement.Add(statementToAdd);

            Assert.NotNull(forStatement.Body);
            Assert.IsNotEmpty(forStatement.Body);
            Assert.AreEqual(statementToAdd, forStatement.Body[0]);
        }

        [Test]
        public void CreateForeachStatement()
        {
            var itemType = new CSharpType(typeof(int));
            var itemName = "item";
            var enumerable = new ValueExpression();

            var foreachStatement = new ForeachStatement(itemType, itemName, enumerable, isAsync: false, out var itemReference);

            Assert.NotNull(foreachStatement);
            Assert.AreEqual(itemType, foreachStatement.ItemType);
            Assert.AreEqual(itemName, foreachStatement.Item.RequestedName);
            Assert.AreEqual(enumerable, foreachStatement.Enumerable);
            Assert.IsFalse(foreachStatement.IsAsync);
            Assert.NotNull(itemReference);
            Assert.AreEqual(itemType, itemReference.Type);
            Assert.AreEqual(itemName, itemReference.Declaration.RequestedName);
        }

        [Test]
        public void ForeachStatementWithAddMethod()
        {
            var foreachStatement = new ForeachStatement(new CSharpType(typeof(int)), "item", new ValueExpression(), isAsync: false, out var itemReference);
            var statementToAdd = new MethodBodyStatement();

            foreachStatement.Add(statementToAdd);

            Assert.NotNull(foreachStatement.Body);
            Assert.IsNotEmpty(foreachStatement.Body);
            Assert.IsTrue(foreachStatement.Body.Any(s => s == statementToAdd));
        }

        [Test]
        public void IfStatementWithBoolExpression()
        {
            var condition = new BoolSnippet(BoolSnippet.True);
            var ifStatement = new IfStatement(condition);

            Assert.NotNull(ifStatement);
            Assert.AreEqual(condition.Untyped, ifStatement.Condition);
            Assert.NotNull(ifStatement.Body);
        }

        [Test]
        public void IfStatementWithAddMethod()
        {
            var ifStatement = new IfStatement(BoolSnippet.True);
            var statementToAdd = new MethodBodyStatement();

            ifStatement.Add(statementToAdd);

            Assert.NotNull(ifStatement.Body);
            Assert.IsInstanceOf<MethodBodyStatement>(ifStatement.Body);
            Assert.IsTrue(((MethodBodyStatements)ifStatement.Body).Statements.Any(s => s == statementToAdd));
        }

        [Test]
        public void IfStatementWithDefaultOptions()
        {
            var condition = new BoolSnippet(BoolSnippet.True);
            var ifStatement = new IfStatement(condition);

            Assert.IsFalse(ifStatement.Inline);
            Assert.IsTrue(ifStatement.AddBraces);
        }

        [Test]
        public void IfStatementInlineOptionTrue()
        {
            var condition = new BoolSnippet(BoolSnippet.True);
            var ifStatement = new IfStatement(condition, inline: true);

            Assert.IsTrue(ifStatement.Inline);
        }

        [Test]
        public void IfStatementAddBracesOptionFalse()
        {
            var condition = new BoolSnippet(BoolSnippet.True);
            var ifStatement = new IfStatement(condition, addBraces: false);

            Assert.IsFalse(ifStatement.AddBraces);
        }

        [Test]
        public void IfElseStatementWithIfAndElse()
        {
            var condition = new BoolSnippet(BoolSnippet.True);
            var elseStatement = new MethodBodyStatement();

            var ifElseStatement = new IfElseStatement(new IfStatement(condition), elseStatement);

            Assert.NotNull(ifElseStatement);
            Assert.NotNull(ifElseStatement.If);
            Assert.AreEqual(condition.Untyped, ifElseStatement.If.Condition);
            Assert.AreEqual(elseStatement, ifElseStatement.Else);
        }

        [Test]
        public void IfElseStatementWithConditionAndStatements()
        {
            var condition = new BoolSnippet(BoolSnippet.True);
            var ifStatement = new MethodBodyStatement();
            var elseStatement = new MethodBodyStatement();

            var ifElseStatement = new IfElseStatement(condition, ifStatement, elseStatement);

            Assert.NotNull(ifElseStatement);
            Assert.NotNull(ifElseStatement.If);
            Assert.AreEqual(condition.Untyped, ifElseStatement.If.Condition);
            Assert.AreEqual(elseStatement, ifElseStatement.Else);
        }

        [Test]
        public void SwitchStatementWithSingleCase()
        {
            var matchExpression = new ValueExpression();
            var switchStatement = new SwitchStatement(matchExpression);

            var caseStatement = new MethodBodyStatement();
            var switchCase = new SwitchCaseStatement(new ValueExpression(), caseStatement);

            switchStatement.Add(switchCase);

            Assert.AreEqual(1, switchStatement.Cases.Count);
            Assert.AreEqual(switchCase, switchStatement.Cases[0]);
        }

        [Test]
        public void SwitchStatementWithMultipleCases()
        {
            var matchExpression = new ValueExpression();
            var switchStatement = new SwitchStatement(matchExpression);

            var caseStatements = new List<SwitchCaseStatement>
            {
                new SwitchCaseStatement(new ValueExpression(), new MethodBodyStatement()),
                new SwitchCaseStatement(new ValueExpression(), new MethodBodyStatement())
            };

            foreach (var switchCase in caseStatements)
            {
                switchStatement.Add(switchCase);
            }

            CollectionAssert.AreEqual(caseStatements, switchStatement.Cases);
        }

        [Test]
        public void SwitchStatementEnumeratingCases()
        {
            var matchExpression = new ValueExpression();
            var switchStatement = new SwitchStatement(matchExpression);

            var caseStatements = new List<SwitchCaseStatement>
            {
                new SwitchCaseStatement(new ValueExpression(), new MethodBodyStatement()),
                new SwitchCaseStatement(new ValueExpression(), new MethodBodyStatement())
            };

            foreach (var switchCase in caseStatements)
            {
                switchStatement.Add(switchCase);
            }

            var enumeratedCases = new List<SwitchCaseStatement>();
            foreach (var caseItem in switchStatement)
            {
                enumeratedCases.Add(caseItem);
            }

            CollectionAssert.AreEqual(caseStatements, enumeratedCases);
        }

        [Test]
        public void TestSwitchStatementWithMultipleCasesWrite()
        {
            var variableFoo = new VariableExpression(typeof(bool), "foo");
            var fooDeclaration = Declare(variableFoo, Bool(true));
            var switchStatement = new SwitchStatement(variableFoo);

            var caseStatements = new List<SwitchCaseStatement>
            {
                new SwitchCaseStatement(Bool(true), Return(variableFoo)),
                SwitchCaseStatement.Default(Return(False))
            };

            foreach (var switchCase in caseStatements)
            {
                switchStatement.Add(switchCase);
            }

            var mockTypeProvider = new Mock<TypeProvider>();

            // Create a method declaration statement
            var method = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: new CSharpType(typeof(bool)),
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { fooDeclaration, switchStatement },
                mockTypeProvider.Object);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(method);

            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
        }

        [Test]
        public void TestSwitchStatementWithUsingStatementWrite()
        {
            var variableFoo = new VariableExpression(typeof(bool), "foo");
            var fooDeclaration = Declare(variableFoo, Bool(true));
            var switchStatement = new SwitchStatement(variableFoo);
            var usingStatement = new UsingScopeStatement(null, new CodeWriterDeclaration("x"), New.Instance(typeof(MemoryStream)))
            {
                Return(variableFoo)
            };

            var caseStatements = new List<SwitchCaseStatement>
            {
                new SwitchCaseStatement(Bool(true), usingStatement),
                SwitchCaseStatement.Default(Return(False))
            };

            foreach (var switchCase in caseStatements)
            {
                switchStatement.Add(switchCase);
            }

            var mockTypeProvider = new Mock<TypeProvider>();

            // Create a method declaration statement
            var method = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: new CSharpType(typeof(bool)),
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { fooDeclaration, switchStatement },
                mockTypeProvider.Object);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(method);

            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
        }


        [Test]
        public void TryCatchFinallyStatementWithTryOnly()
        {
            var tryStatement = new MethodBodyStatement();
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            Assert.AreEqual(0, tryCatchFinally.Catches.Count);
            Assert.IsNull(tryCatchFinally.Finally);
        }

        [Test]
        public void TryCatchFinallyStatementWithTryAndCatch()
        {
            var tryStatement = new MethodBodyStatement();
            var catchStatement = new CatchExpression(null, new MethodBodyStatement());
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement, catchStatement, null);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            Assert.AreEqual(1, tryCatchFinally.Catches.Count);
            Assert.AreEqual(catchStatement, tryCatchFinally.Catches[0]);
            Assert.IsNull(tryCatchFinally.Finally);
        }

        [Test]
        public void TryCatchFinallyStatementWithTryCatchAndFinally()
        {
            var tryStatement = new MethodBodyStatement();
            var catchStatement = new CatchExpression(null, new MethodBodyStatement());
            var finallyStatement = new MethodBodyStatement();
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement, catchStatement, finallyStatement);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            Assert.AreEqual(1, tryCatchFinally.Catches.Count);
            Assert.AreEqual(catchStatement, tryCatchFinally.Catches[0]);
            Assert.AreEqual(finallyStatement, tryCatchFinally.Finally);
        }

        [Test]
        public void TryCatchFinallyStatementWithMultipleCatches()
        {
            var tryStatement = new MethodBodyStatement();
            var catchStatements = new[]
            {
                new CatchExpression(null, new MethodBodyStatement()),
                new CatchExpression(null, new MethodBodyStatement())
            };
            var finallyStatement = new MethodBodyStatement();
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement, catchStatements, finallyStatement);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            CollectionAssert.AreEqual(catchStatements, tryCatchFinally.Catches);
            Assert.AreEqual(finallyStatement, tryCatchFinally.Finally);
        }

        [Test]
        public void TestIfElsePreprocessorStatement()
        {
            // Set up test conditions and variables
            var condition = "MOCKCONDITION";
            var variableX = new VariableExpression(typeof(int), "x");
            var variableFoo = new VariableExpression(typeof(int), "foo");
            var variableBar = new VariableExpression(typeof(int), "bar");
            var xDeclaration = Declare(variableX, Int(1));
            var ifStatementBody = Declare(variableFoo, Int(2));
            var elseStatementBody = Declare(variableBar, Int(2));
            var ifElsePreprocessor = new IfElsePreprocessorStatement(condition, ifStatementBody, elseStatementBody);
            var mockTypeProvider = new Mock<TypeProvider>();

            // Create a method declaration statement
            var method = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: null,
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { xDeclaration, ifElsePreprocessor },
                mockTypeProvider.Object);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(method);

            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
        }
    }
}
