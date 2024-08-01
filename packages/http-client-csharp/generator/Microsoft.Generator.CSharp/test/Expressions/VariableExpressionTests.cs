// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    public class VariableExpressionTests
    {
        [Test]
        public void VariableExpressionWithoutRef()
        {
            var variableExpression = new VariableExpression(typeof(int), "foo");
            using CodeWriter writer = new CodeWriter();
            variableExpression.Write(writer);

            Assert.AreEqual("foo", writer.ToString(false));
        }

        [Test]
        public void VariableExpressionWithRef()
        {
            var variableExpression = new VariableExpression(typeof(int), "foo", true);
            using CodeWriter writer = new CodeWriter();
            variableExpression.Write(writer);

            Assert.AreEqual("ref foo", writer.ToString(false));
        }
    }
}
