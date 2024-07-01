// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    public class UnaryOperationExpressionTests
    {
        [Test]
        public void UnaryOperatorStatementWithValidExpression()
        {
            var foo = new VariableExpression(typeof(int), "foo");
            var operatorExpression = new UnaryOperatorExpression("-", foo, false);
            using CodeWriter writer = new CodeWriter();
            operatorExpression.Write(writer);

            Assert.AreEqual("-foo", writer.ToString(false));
        }

        [Test]
        public void OperandOnLeft()
        {
            var foo = new VariableExpression(typeof(int), "foo");
            var operatorExpression = new UnaryOperatorExpression("-", foo, true);
            using CodeWriter writer = new CodeWriter();
            operatorExpression.Write(writer);

            Assert.AreEqual("foo-", writer.ToString(false));
        }
    }
}
