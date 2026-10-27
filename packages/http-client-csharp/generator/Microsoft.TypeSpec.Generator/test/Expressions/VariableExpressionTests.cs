// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Expressions
{
    public class VariableExpressionTests
    {
        [Test]
        public void VariableExpressionWritesName()
        {
            var variableExpression = new VariableExpression(typeof(int), "foo");
            using CodeWriter writer = new CodeWriter();
            variableExpression.Write(writer);

            Assert.AreEqual("foo", writer.ToString(false));
        }

        [Test]
        public void VariableExpressionWrappedAsRefAndOutArgument()
        {
            var variableExpression = new VariableExpression(typeof(int), "foo");

            var refArgument = new ArgumentExpression(variableExpression, IsRef: true);
            Assert.IsTrue(refArgument.IsRef);
            Assert.IsFalse(refArgument.IsOut);

            var outArgument = new ArgumentExpression(variableExpression, IsOut: true);
            Assert.IsTrue(outArgument.IsOut);
            Assert.IsFalse(outArgument.IsRef);
        }
    }
}
