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
        public void VariableExpressionSupportsLegacyRefAndOutConstructor()
        {
#pragma warning disable CS0618 // Obsolete
            var variableExpression = new VariableExpression(typeof(int), "foo", isRef: true, isOut: true);

            Assert.IsTrue(variableExpression.IsRef);
            Assert.IsTrue(variableExpression.IsOut);
#pragma warning restore CS0618
        }
    }
}
