// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class SnippetTests
    {
        [Test]
        public void ValidateFloat()
        {
            using CodeWriter writer = new CodeWriter();
            Snippet.Float(1.1f).Write(writer);
            Assert.AreEqual("1.1F", writer.ToString(false));
        }

        [Test]
        public void ValidateString()
        {
            using CodeWriter writer = new CodeWriter();
            Snippet.Literal("testing").Untyped.Write(writer);
            Assert.AreEqual("\"testing\"", writer.ToString(false));
        }

        [Test]
        public void ValidateStringU8()
        {
            using CodeWriter writer = new CodeWriter();
            Snippet.LiteralU8("testing").Untyped.Write(writer);
            Assert.AreEqual("\"testing\"u8", writer.ToString(false));
        }
    }
}
