// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using Microsoft.Generator.CSharp.Expressions;
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
    }
}
