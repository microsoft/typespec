// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Statements
{
    public class XmlDocStatementTests
    {
        [Test]
        public void InvalidDocComment()
        {
            var statement = new XmlDocStatement("<tag>", "</tag>", [$"<|endoftext|>"]);
            var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocCommentWithCref()
        {
            var statement = new XmlDocStatement("<tag>", "</tag>", [$"{typeof(int):C} <|endoftext|>"]);
            var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> <see cref=\"int\"/> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocCommentWithCrefMethod()
        {
            var statement = new XmlDocStatement("<tag>", "</tag>", [$"<see cref=\"{typeof(BinaryData)}.FromBytes(byte[])\"/> <|endoftext|>"]);
            var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> <see cref=\"global::System.BinaryData.FromBytes(byte[])\"/> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }

        [Test]
        public void InvalidDocInFormatArg()
        {
            var invalid = "<|endoftext|>";
            var statement = new XmlDocStatement("<tag>", "</tag>", [$"{invalid}"]);
            var writer = new CodeWriter();
            statement.Write(writer);
            Assert.AreEqual("/// <tag> &lt;|endoftext|&gt;. </tag>\n", writer.ToString(false));
        }
    }
}
