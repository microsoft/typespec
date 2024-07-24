// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Statements
{
    public class StatementTests
    {
        public StatementTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void CreateForStatement()
        {
            var assignment = new AssignmentExpression(new DeclarationExpression(new CSharpType(typeof(BinaryData)), "responseParamName"), ValueExpression.Empty);
            var condition = True;
            var increment = ValueExpression.Empty;
            var forStatement = new ForStatement(assignment, condition, increment);

            Assert.NotNull(forStatement);
            Assert.IsEmpty(forStatement.Body);
        }

        [Test]
        public void ForStatementWithAddMethod()
        {
            var assignment = new AssignmentExpression(new DeclarationExpression(new CSharpType(typeof(BinaryData)), "responseParamName"), ValueExpression.Empty);
            var condition = True;
            var increment = ValueExpression.Empty;
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
            var enumerable = ValueExpression.Empty;

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
            var foreachStatement = new ForeachStatement(new CSharpType(typeof(int)), "item", ValueExpression.Empty, isAsync: false, out var itemReference);
            var statementToAdd = new MethodBodyStatement();

            foreachStatement.Add(statementToAdd);

            Assert.NotNull(foreachStatement.Body);
            Assert.IsNotEmpty(foreachStatement.Body);
            Assert.IsTrue(foreachStatement.Body.Any(s => s == statementToAdd));
        }

        [Test]
        public void IfStatementWithBoolExpression()
        {
            var condition = True;
            var ifStatement = new IfStatement(condition);

            using var writer = new CodeWriter();
            ifStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void IfStatementWithAddMethod()
        {
            var ifStatement = new IfStatement(True);
            var statementToAdd = new MethodBodyStatement();

            ifStatement.Add(statementToAdd);

            Assert.NotNull(ifStatement.Body);
            Assert.IsInstanceOf<MethodBodyStatement>(ifStatement.Body);
            Assert.IsTrue(((MethodBodyStatements)ifStatement.Body).Statements.Any(s => s == statementToAdd));
        }

        [Test]
        public void IfStatementWithDefaultOptions()
        {
            var condition = True;
            var ifStatement = new IfStatement(condition);

            Assert.IsFalse(ifStatement.Inline);
            Assert.IsTrue(ifStatement.AddBraces);
        }

        [Test]
        public void IfStatementInlineOptionTrue()
        {
            var condition = True;
            var ifStatement = new IfStatement(condition, inline: true);

            Assert.IsTrue(ifStatement.Inline);
        }

        [Test]
        public void IfStatementAddBracesOptionFalse()
        {
            var condition = True;
            var ifStatement = new IfStatement(condition, addBraces: false);

            Assert.IsFalse(ifStatement.AddBraces);
        }

        [Test]
        public void IfElseStatementWithIfAndElse()
        {
            var condition = True;
            var elseStatement = new MethodBodyStatement();

            var ifElseStatement = new IfElseStatement(new IfStatement(condition), elseStatement);

            using var writer = new CodeWriter();
            ifElseStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void IfElseStatementWithConditionAndStatements()
        {
            var condition = True;
            var ifStatement = new MethodBodyStatement();
            var elseStatement = new MethodBodyStatement();

            var ifElseStatement = new IfElseStatement(condition, ifStatement, elseStatement);

            using var writer = new CodeWriter();
            ifElseStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void SwitchStatementWithSingleCase()
        {
            var matchExpression = ValueExpression.Empty;
            var switchStatement = new SwitchStatement(matchExpression);

            var caseStatement = new MethodBodyStatement();
            var switchCase = new SwitchCaseStatement(ValueExpression.Empty, caseStatement);

            switchStatement.Add(switchCase);

            Assert.AreEqual(1, switchStatement.Cases.Count);
            Assert.AreEqual(switchCase, switchStatement.Cases[0]);
        }

        [Test]
        public void SwitchStatementWithMultipleCases()
        {
            var matchExpression = ValueExpression.Empty;
            var switchStatement = new SwitchStatement(matchExpression);

            var caseStatements = new List<SwitchCaseStatement>
            {
                new SwitchCaseStatement(ValueExpression.Empty, new MethodBodyStatement()),
                new SwitchCaseStatement(ValueExpression.Empty, new MethodBodyStatement())
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
            var matchExpression = ValueExpression.Empty;
            var switchStatement = new SwitchStatement(matchExpression);

            var caseStatements = new List<SwitchCaseStatement>
            {
                new SwitchCaseStatement(ValueExpression.Empty, new MethodBodyStatement()),
                new SwitchCaseStatement(ValueExpression.Empty, new MethodBodyStatement())
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

            // Create a method declaration statement
            var method = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: new CSharpType(typeof(bool)),
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { fooDeclaration, switchStatement },
                TestTypeProvider.Empty);

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

            // Create a method declaration statement
            var method = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: new CSharpType(typeof(bool)),
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { fooDeclaration, switchStatement },
                TestTypeProvider.Empty);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(method);

            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
        }

        [Test]
        public void TryStatementWithEmptyBody()
        {
            var tryStatement = new TryStatement();
            Assert.IsEmpty(tryStatement.Body);
        }

        [Test]
        public void TryStatementWithOneLineBody()
        {
            var tryStatement = new TryStatement() { Return(True) };
            Assert.AreEqual(1, tryStatement.Body.Count);
        }

        [Test]
        public void TryStatementWithMultipleLineBody()
        {
            var tryStatement = new TryStatement
            {
                Declare(new VariableExpression(typeof(int), "foo"), Literal(5)),
                Return(True)
            };
            Assert.AreEqual(2, tryStatement.Body.Count);
        }

        [Test]
        public void CatchStatementWithEmptyBody()
        {
            var catchStatement = new CatchStatement(null);
            Assert.IsEmpty(catchStatement.Body);
        }

        [Test]
        public void CatchStatementWithOneLineBody()
        {
            var catchStatement = new CatchStatement(null) { Return(True) };
            Assert.AreEqual(1, catchStatement.Body.Count);
        }

        [Test]
        public void CatchStatementWithMultipleLineBody()
        {
            var catchStatement = new CatchStatement(null)
            {
                Declare(new VariableExpression(typeof(int), "foo"), Literal(5)),
                Return(True)
            };
            Assert.AreEqual(2, catchStatement.Body.Count);
        }

        [Test]
        public void FinallyStatementWithEmptyBody()
        {
            var finallyStatement = new FinallyStatement();
            Assert.IsEmpty(finallyStatement.Body);
        }

        [Test]
        public void FinallyStatementWithOneLineBody()
        {
            var finallyStatement = new FinallyStatement() { Return(True) };
            Assert.AreEqual(1, finallyStatement.Body.Count);
        }

        [Test]
        public void FinallyStatementWithMultipleLineBody()
        {
            var finallyStatement = new FinallyStatement
            {
                Declare(new VariableExpression(typeof(int), "foo"), Literal(5)),
                Return(True)
            };
            Assert.AreEqual(2, finallyStatement.Body.Count);
        }


        [Test]
        public void TryCatchFinallyStatementWithTryOnly()
        {
            var tryStatement = new TryStatement();
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            Assert.AreEqual(0, tryCatchFinally.Catches.Count);
            Assert.IsNull(tryCatchFinally.Finally);
        }

        [Test]
        public void TryCatchFinallyStatementWithTryAndCatch()
        {
            var tryStatement = new TryStatement();
            var catchStatement = new CatchStatement(null);
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement, catchStatement, null);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            Assert.AreEqual(1, tryCatchFinally.Catches.Count);
            Assert.AreEqual(catchStatement, tryCatchFinally.Catches[0]);
            Assert.IsNull(tryCatchFinally.Finally);
        }

        [Test]
        public void TryCatchFinallyStatementWithTryCatchAndFinally()
        {
            var tryStatement = new TryStatement();
            var catchStatement = new CatchStatement(null);
            var finallyStatement = new FinallyStatement();
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement, catchStatement, finallyStatement);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            Assert.AreEqual(1, tryCatchFinally.Catches.Count);
            Assert.AreEqual(catchStatement, tryCatchFinally.Catches[0]);
            Assert.AreEqual(finallyStatement, tryCatchFinally.Finally);
        }

        [Test]
        public void TryCatchFinallyStatementWithMultipleCatches()
        {
            var tryStatement = new TryStatement();
            var var1 = new DeclarationExpression(typeof(UnauthorizedAccessException), "ex1");
            var var2 = new DeclarationExpression(typeof(Exception), "ex2");
            var catchStatements = new[]
            {
                new CatchStatement(var1),
                new CatchStatement(var2)
            };
            var finallyStatement = new FinallyStatement();
            var tryCatchFinally = new TryCatchFinallyStatement(tryStatement, catchStatements, finallyStatement);

            Assert.AreEqual(tryStatement, tryCatchFinally.Try);
            CollectionAssert.AreEqual(catchStatements, tryCatchFinally.Catches);
            Assert.AreEqual(finallyStatement, tryCatchFinally.Finally);

            // Create a method declaration statement
            var method = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: new CSharpType(typeof(bool)),
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { tryCatchFinally },
                TestTypeProvider.Empty);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(method);
            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
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

            // Create a method declaration statement
            var method = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: null,
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { xDeclaration, ifElsePreprocessor },
                TestTypeProvider.Empty);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(method);

            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
        }
    }
}
