// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Statements
{
    public class XmlDocParamStatementTests
    {
        [Test]
        public void InvalidDocComment()
        {
            var statement = new XmlDocParamStatement("foo", $"<|endoftext|>");
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <param name=\"foo\"> &lt;|endoftext|&gt;. </param>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocCommentWithExtra()
        {
            var statement = new XmlDocParamStatement("foo", $"description with xml <|endoftext|>");
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <param name=\"foo\"> description with xml &lt;|endoftext|&gt;. </param>\n", writer.ToString(false));
        }
    }
}
