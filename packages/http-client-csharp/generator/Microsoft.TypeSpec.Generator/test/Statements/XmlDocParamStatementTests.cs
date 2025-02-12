// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Statements
{
    public class XmlDocParamStatementTests
    {
        [TestCase("new-parameter", ExpectedResult = "/// <param name=\"newParameter\"></param>\n")]
        [TestCase("param", ExpectedResult = "/// <param name=\"param\"></param>\n")]
        [TestCase("void", ExpectedResult = "/// <param name=\"void\"></param>\n")]
        [TestCase("@what", ExpectedResult = "/// <param name=\"what\"></param>\n")]
        public string XmlDocForParameterWithInvalidIdentifierName(string parameterName)
        {
            var parameter = new ParameterProvider(parameterName, FormattableStringHelpers.Empty, typeof(string));
            var statement = new XmlDocParamStatement(parameter);
            using var writer = new CodeWriter();
            statement.Write(writer);
            return writer.ToString(false);
        }

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
