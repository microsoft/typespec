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
        public void VerifyTupleExpressionAssignment()
        {
            var item1 = new ParameterProvider("item1", FormattableStringHelpers.Empty, new CSharpType(typeof(int)));
            var item2 = new ParameterProvider("item2", FormattableStringHelpers.Empty, new CSharpType(typeof(string)));
            var variableTupleExpression = new VariableTupleExpression(false, item1, item2);
            using CodeWriter writer = new CodeWriter();
            variableTupleExpression.Assign(new TupleExpression(Literal(1), Literal("a"))).Write(writer);
            Assert.AreEqual("(int item1, string item2) = (1, \"a\")", writer.ToString(false));
        }

        [Test]
        public void VerifyTupleExpressionWithRef()
        {
            var item1 = new ParameterProvider("item1", FormattableStringHelpers.Empty, new CSharpType(typeof(int)));
            var item2 = new ParameterProvider("item2", FormattableStringHelpers.Empty, new CSharpType(typeof(string)));
            var tupleVariableExpression = new VariableTupleExpression(true, item1, item2);
            using CodeWriter writer = new CodeWriter();
            tupleVariableExpression.Write(writer);
            Assert.AreEqual("ref (int item1, string item2)", writer.ToString(false));
        }
    }
}
