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
            var toValue = new ValueExpression();
            var fromValue = new ValueExpression();

            var assignStatement = toValue.Assign(fromValue);

            Assert.NotNull(assignStatement);
            Assert.AreEqual(toValue, assignStatement.Variable);
            Assert.AreEqual(fromValue, assignStatement.Value);
        }

    }
}
