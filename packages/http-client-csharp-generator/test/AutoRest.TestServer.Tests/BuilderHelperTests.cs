// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoRest.CSharp.Output.Builders;
using NUnit.Framework;

namespace AutoRest.CSharp.Utilities.Tests
{
    public class BuilderHelperTests
    {
        [TestCase("a", "a")]
        [TestCase("", "")]
        [TestCase(null, null)]
        [TestCase("a&b", "a&amp;b")]
        [TestCase("a'b", "a'b")]
        [TestCase("a\"b", "a\"b")]
        [TestCase("a<b", "a&lt;b")]
        [TestCase("a>b", "a&gt;b")]
        [TestCase("&b", "&amp;b")]
        [TestCase("'b", "'b")]
        [TestCase("\"b", "\"b")]
        [TestCase("<b", "&lt;b")]
        [TestCase(">b", "&gt;b")]
        [TestCase("a&", "a&amp;")]
        [TestCase("a'", "a'")]
        [TestCase("a\"", "a\"")]
        [TestCase("a<", "a&lt;")]
        [TestCase("a>", "a&gt;")]
        [TestCase("a&b'", "a&amp;b'")]
        [TestCase("a'b\"", "a'b\"")]
        [TestCase("a\"b<", "a\"b&lt;")]
        [TestCase("a<b>", "a&lt;b&gt;")]
        [TestCase("a>b&", "a&gt;b&amp;")]
        [TestCase("a&amp;b", "a&amp;b")]
        [TestCase("a&lt;b", "a&lt;b")]
        [TestCase("a&gt;b", "a&gt;b")]
        [TestCase("a&apos;b", "a&apos;b")]
        [TestCase("a&quot;b", "a&quot;b")]
        [TestCase("&amp;b", "&amp;b")]
        [TestCase("&lt;b", "&lt;b")]
        [TestCase("&gt;b", "&gt;b")]
        [TestCase("&apos;b", "&apos;b")]
        [TestCase("&quot;b", "&quot;b")]
        [TestCase("a&amp;", "a&amp;")]
        [TestCase("a&lt;", "a&lt;")]
        [TestCase("a&gt;", "a&gt;")]
        [TestCase("a&apos;", "a&apos;")]
        [TestCase("a&quot;", "a&quot;")]
        [TestCase("a&amp;b&", "a&amp;b&amp;")]
        [TestCase("a&lt;b<", "a&lt;b&lt;")]
        [TestCase("a&gt;b>", "a&gt;b&gt;")]
        [TestCase("a&apos;b'", "a&apos;b'")]
        [TestCase("a&quot;b\"", "a&quot;b\"")]
        public void VerifyEscapeXmlDoc(string input, string expected)
        {
            var actual = BuilderHelpers.EscapeXmlDocDescription(input);
            Assert.AreEqual(expected, actual);
        }
    }
}
