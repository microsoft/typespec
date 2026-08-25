// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Statements
{
    public class XmlDocStatementTests
    {
        [Test]
        public void InvalidDocComment()
        {
            var statement = new XmlDocStatement($"<tag>", $"</tag>", [$"<|endoftext|>"]);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocCommentWithCref()
        {
            var statement = new XmlDocStatement($"<tag>", $"</tag>", [$"{typeof(int):C} <|endoftext|>"]);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> <see cref=\"int\"/> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocCommentWithCrefMethod()
        {
            var statement = new XmlDocStatement($"<tag>", $"</tag>", [$"<see cref=\"{typeof(BinaryData)}.FromBytes(byte[])\"/> <|endoftext|>"]);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> <see cref=\"global::System.BinaryData.FromBytes(byte[])\"/> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocInFormatArg()
        {
            var invalid = "<|endoftext|>";
            var statement = new XmlDocStatement($"<tag>", $"</tag>", [$"{invalid}"]);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }

        [TestCase("\r")]
        [TestCase("\r\n")]
        [TestCase("\n")]
        [TestCase("\u0085")]
        [TestCase("\u2028")]
        [TestCase("\u2029")]
        public void LineTerminatorsInLiteralAreNormalized(string terminator)
        {
            var statement = new XmlDocStatement($"<tag>", $"</tag>", [$"first{terminator}second"]);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag>\n/// first\n/// second\n/// </tag>\n", writer.ToString(false));
        }

        [TestCase("\r")]
        [TestCase("\r\n")]
        [TestCase("\n")]
        [TestCase("\u0085")]
        [TestCase("\u2028")]
        [TestCase("\u2029")]
        public void LineTerminatorsInArgumentAreNormalized(string terminator)
        {
            var text = $"first{terminator}second";
            var statement = new XmlDocStatement($"<tag>", $"</tag>", [$"{text}"]);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag>\n/// first\n/// second\n/// </tag>\n", writer.ToString(false));
        }

        [Test]
        public void AllLineTerminatorsAreNormalized()
        {
            var statement = new XmlDocStatement(
                $"<tag>",
                $"</tag>",
                [$"first\rsecond\r\nthird\u0085fourth\u2028fifth\u2029sixth\nseventh"]);
            using var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual(
                "/// <tag>\n/// first\n/// second\n/// third\n/// fourth\n/// fifth\n/// sixth\n/// seventh\n/// </tag>\n",
                writer.ToString(false));
        }
    }
}
