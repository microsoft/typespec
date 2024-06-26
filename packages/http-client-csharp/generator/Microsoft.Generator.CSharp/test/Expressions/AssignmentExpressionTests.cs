// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    public class AssignmentExpressionTests
    {
        [Test]
        public void AssignmentExpression()
        {
            var toValue = new VariableExpression(typeof(int), "foo");
            var fromValue = Literal(1);

            using CodeWriter writer = new();
            var assignExpression = toValue.Assign(fromValue);
            assignExpression.Write(writer);

            Assert.NotNull(assignExpression);
            Assert.AreEqual(toValue, assignExpression.Variable);
            Assert.AreEqual(fromValue, assignExpression.Value);
            Assert.AreEqual("foo = 1", writer.ToString(false));
        }

        [Test]
        public void AssignValueIfNullStatement()
        {
            var toValue = new VariableExpression(typeof(int), "foo");
            var fromValue = Literal(1);

            using CodeWriter writer = new();
            var assignExpression = toValue.Assign(fromValue, true);
            assignExpression.Write(writer);

            Assert.NotNull(assignExpression);
            Assert.AreEqual(toValue, assignExpression.Variable);
            Assert.AreEqual(fromValue, assignExpression.Value);
            Assert.AreEqual("foo ??= 1", writer.ToString(false));
        }
    }
}
