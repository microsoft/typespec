// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    internal class TupleExpressionTests
    {
        [Test]
        public void VerifyTupleExpressionWrite()
        {
            var tupleExpression = new TupleExpression(Null, Static<CancellationToken>().Property("None"));
            using CodeWriter writer = new CodeWriter();
            tupleExpression.Write(writer);

            Assert.AreEqual("(null, global::System.Threading.CancellationToken.None)", writer.ToString(false));
        }

        [Test]
        public void VerifyTUpleExpressionAssignment()
        {
            var item1 = new ParameterProvider("item1", FormattableStringHelpers.Empty, new CSharpType(typeof(int)));
            var item2 = new ParameterProvider("item2", FormattableStringHelpers.Empty, new CSharpType(typeof(int)));
            var variableTupleExpression = new VariableTupleExpression(false, item1, item2);
            using CodeWriter writer = new CodeWriter();
            variableTupleExpression.Assign(new TupleExpression(Literal(1), Literal(2))).Write(writer);
            Assert.AreEqual("(int item1, int item2) = (1, 2)", writer.ToString(false));
        }
    }
}
