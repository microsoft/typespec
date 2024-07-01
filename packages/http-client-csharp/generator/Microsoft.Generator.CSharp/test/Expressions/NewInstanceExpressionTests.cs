// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    internal class NewInstanceExpressionTests
    {
        [Test]
        public void ValidateAnonymousSingleLine()
        {
            using CodeWriter writer = new CodeWriter();
            new NewInstanceExpression(null, [], new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("key"), Literal(1) }
            },
            true)).Write(writer);
            Assert.AreEqual("new { key = 1 }", writer.ToString(false));
        }

        [Test]
        public void ValidateAnonymousWithPropertiesSingleLine()
        {
            using CodeWriter writer = new CodeWriter();
            new NewInstanceExpression(null, [], new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("key"), Literal(1) },
                { Identifier("value"), Literal(2) }
            },
            true)).Write(writer);
            Assert.AreEqual("new { key = 1, value = 2 }", writer.ToString(false));
        }

    }
}
