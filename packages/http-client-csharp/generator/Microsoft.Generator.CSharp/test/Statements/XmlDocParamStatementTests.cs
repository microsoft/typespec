// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Statements
{
    public class XmlDocParamStatementTests
    {
        [Test]
        public void InvalidDocComment()
        {
            var parameter = new ParameterProvider("foo", $"<|endoftext|>", typeof(string));
            var statement = new XmlDocParamStatement(parameter);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <param name=\"foo\"> &lt;|endoftext|&gt;. </param>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocCommentWithExtra()
        {
            var parameter = new ParameterProvider("foo", $"description with xml <|endoftext|>", typeof(string));
            var statement = new XmlDocParamStatement(parameter);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <param name=\"foo\"> description with xml &lt;|endoftext|&gt;. </param>\n", writer.ToString(false));
        }
    }
}
