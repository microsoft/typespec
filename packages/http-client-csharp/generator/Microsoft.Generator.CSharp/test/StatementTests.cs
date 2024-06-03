// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class StatementTests
    {
        [Test]
        public void AssignValueIfNullStatement()
        {
            var toValue = new ValueExpression();
            var fromValue = new ValueExpression();

            var assignStatement = new AssignValueIfNullStatement(toValue, fromValue);

            Assert.NotNull(assignStatement);
            Assert.AreEqual(toValue, assignStatement.To);
            Assert.AreEqual(fromValue, assignStatement.From);
        }

        [Test]
        public void AssignValueStatement()
        {
            var toValue = new ValueExpression();
            var fromValue = new ValueExpression();

            var assignStatement = new AssignValueStatement(toValue, fromValue);

            Assert.NotNull(assignStatement);
            Assert.AreEqual(toValue, assignStatement.To);
            Assert.AreEqual(fromValue, assignStatement.From);
        }

        [Test]
        public void CreateForStatement()
        {
            var assignment = new AssignmentExpression(new DeclarationExpression(new CSharpType(typeof(BinaryData)), new CodeWriterDeclaration("responseParamName")), new ValueExpression());
            var condition = new BoolSnippet(BoolSnippet.True);
            var increment = new ValueExpression();
            var forStatement = new ForStatement(assignment, condition, increment);

            Assert.NotNull(forStatement);
            Assert.IsEmpty(forStatement.Body);
        }

        [Test]
        public void ForStatementWithAddMethod()
        {
            var assignment = new AssignmentExpression(new DeclarationExpression(new CSharpType(typeof(BinaryData)), new CodeWriterDeclaration("responseParamName")), new ValueExpression());
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
            var ifStatement = new IfStatement(condition, Inline: true);

            Assert.IsTrue(ifStatement.Inline);
        }

        [Test]
        public void IfStatementAddBracesOptionFalse()
        {
            var condition = new BoolSnippet(BoolSnippet.True);
            var ifStatement = new IfStatement(condition, AddBraces: false);

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
        public void UnaryOperatorStatementWithValidExpression()
        {
            var operatorExpression = new UnaryOperatorExpression("-", new ValueExpression(), true);
            var unaryOperatorStatement = new UnaryOperatorStatement(operatorExpression);

            Assert.AreEqual(operatorExpression, unaryOperatorStatement.Expression);
        }
    }
}
