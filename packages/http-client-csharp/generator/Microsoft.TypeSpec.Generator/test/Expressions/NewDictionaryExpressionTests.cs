// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;


namespace Microsoft.TypeSpec.Generator.Tests.Expressions
{
    public class NewDictionaryExpressionTests
    {
        [Test]
        public void UseNewInstanceExpression()
        {
            var expression = new NewInstanceExpression(typeof(Dictionary<string, int>), [], new DictionaryInitializerExpression(new Dictionary<ValueExpression, ValueExpression>
            {
                { Literal("x"), Literal(1) },
                { Literal("y"), Literal(2) }
            }));
            using CodeWriter writer = new();
            expression.Write(writer);
            var actual = writer.ToString(false);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }
    }
}
