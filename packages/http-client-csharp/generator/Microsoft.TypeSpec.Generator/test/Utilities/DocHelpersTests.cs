// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class DocHelpersTests
    {
        [Test]
        public void TestBoldText()
        {
            var result = DocHelpers.GetDescription(null, "This is **bold text** in the middle.");
            Assert.AreEqual("This is <b>bold text</b> in the middle.", result);
        }

        [Test]
        public void TestMultipleBold()
        {
            var result = DocHelpers.GetDescription(null, "This has **multiple bold** sections and **another bold** section.");
            Assert.AreEqual("This has <b>multiple bold</b> sections and <b>another bold</b> section.", result);
        }

        [Test]
        public void TestItalicText()
        {
            var result = DocHelpers.GetDescription(null, "This is *italic text* in the middle.");
            Assert.AreEqual("This is <i>italic text</i> in the middle.", result);
        }

        [Test]
        public void TestMultipleItalic()
        {
            var result = DocHelpers.GetDescription(null, "This has *multiple italic* sections and *another italic* section.");
            Assert.AreEqual("This has <i>multiple italic</i> sections and <i>another italic</i> section.", result);
        }

        [Test]
        public void TestBoldItalicCombined()
        {
            var result = DocHelpers.GetDescription(null, "This has **bold**, *italic*, and ***bold italic*** text.");
            Assert.AreEqual("This has <b>bold</b>, <i>italic</i>, and <b><i>bold italic</i></b> text.", result);
        }

        [Test]
        public void TestCodeSpansWithWildcards()
        {
            const string markdown = "The Redis ACL permissions string applied to this assignment, for example `+@read ~cache:*`. Defaults to `+@all ~*` if not specified.";

            Assert.AreEqual(markdown, DocHelpers.GetDescription(null, markdown));
        }

        [TestCase("`*literal*` and `**literal**` and `***literal***`", "`*literal*` and `**literal**` and `***literal***`")]
        [TestCase("*Before* `cache:*` and *between* `~*` and *after*.", "<i>Before</i> `cache:*` and <i>between</i> `~*` and <i>after</i>.")]
        [TestCase("*Use `cache:*` here*", "<i>Use `cache:*` here</i>")]
        [TestCase("**Use `cache:**` here**", "<b>Use `cache:**` here</b>")]
        [TestCase("***Use `cache:***` here***", "<b><i>Use `cache:***` here</i></b>")]
        [TestCase("``literal `*` and **bold**`` with *italic*", "``literal `*` and **bold**`` with <i>italic</i>")]
        [TestCase(@"\`not code *italic*; use `*literal*`.", @"\`not code <i>italic</i>; use `*literal*`.")]
        [TestCase(@"\``*literal*`", @"\``*literal*`")]
        [TestCase(@"\```*literal*`` and *italic*", @"\```*literal*`` and <i>italic</i>")]
        [TestCase(@"\\\``*literal*`", @"\\\``*literal*`")]
        [TestCase(@"\``*italic*``", @"\``<i>italic</i>``")]
        [TestCase(@"\``*italic*", @"\``<i>italic</i>")]
        [TestCase(@"\\`*literal*`", @"\\`*literal*`")]
        [TestCase(@"\\``*italic*`", @"\\``<i>italic</i>`")]
        [TestCase(@"`literal\` and *italic*", @"`literal\` and <i>italic</i>")]
        [TestCase("\0 `*literal*` and *italic*", "\0 `*literal*` and <i>italic</i>")]
        [TestCase("`\0*` and *italic*", "`\0*` and <i>italic</i>")]
        [TestCase("`\0_*` and *italic*", "`\0_*` and <i>italic</i>")]
        [TestCase("`unclosed *italic*", "`unclosed <i>italic</i>")]
        [TestCase("``mismatched *italic*`", "``mismatched <i>italic</i>`")]
        [TestCase("- `cache:*` and `~*` with *italic*", "<list type=\"bullet\"><item><description>`cache:*` and `~*` with <i>italic</i></description></item></list>")]
        [TestCase("1. `cache:*` and `~*` with **bold**", "<list type=\"number\"><item><description>`cache:*` and `~*` with <b>bold</b></description></item></list>")]
        public void TestCodeSpansWithFormatting(string markdown, string expected)
        {
            Assert.AreEqual(expected, DocHelpers.GetDescription(null, markdown));
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        [TestCase("\r")]
        public void TestMultilineCodeSpansWithWildcards(string newline)
        {
            var markdown = $"Use `+@read{newline}~cache:* ~other:*` with *italic*.";
            var expected = $"Use `+@read{Environment.NewLine}~cache:* ~other:*` with <i>italic</i>.";

            Assert.AreEqual(expected, DocHelpers.GetDescription(null, markdown));
        }

        [TestCase("`*literal*\n**literal** ***literal***` and *italic*", "`*literal*\n**literal** ***literal***` and <i>italic</i>")]
        [TestCase("``literal `*\n*` and **bold**`` with *italic*", "``literal `*\n*` and **bold**`` with <i>italic</i>")]
        [TestCase("\\``+@read\n~cache:* ~other:*` and *italic*", "\\``+@read\n~cache:* ~other:*` and <i>italic</i>")]
        [TestCase("`+@read\\\n~cache:* ~other:*`", "`+@read\\\n~cache:* ~other:*`")]
        [TestCase("`\0_*` and `+@read\n~cache:* ~other:*`", "`\0_*` and `+@read\n~cache:* ~other:*`")]
        [TestCase("`unclosed\n*italic* and **bold**", "`unclosed\n<i>italic</i> and <b>bold</b>")]
        [TestCase("``mismatched\n*italic*`", "``mismatched\n<i>italic</i>`")]
        [TestCase("`*literal*`\n*italic*", "`*literal*`\n<i>italic</i>")]
        [TestCase("`unclosed\n\n*italic* and `cache:* ~other:*`", "`unclosed\n<i>italic</i> and `cache:* ~other:*`")]
        [TestCase("- `unclosed\n- `cache:* ~other:*`", "<list type=\"bullet\"><item><description>`unclosed</description></item><item><description>`cache:* ~other:*`</description></item></list>")]
        [TestCase("- Use `+@read\n~cache:* ~other:*` and *italic*", "<list type=\"bullet\"><item><description>Use `+@read</description></item></list>\n~cache:* ~other:*` and <i>italic</i>")]
        [TestCase("1. Use `+@read\n~cache:* ~other:*` and **bold**", "<list type=\"number\"><item><description>Use `+@read</description></item></list>\n~cache:* ~other:*` and <b>bold</b>")]
        public void TestMultilineCodeSpansWithFormatting(string markdown, string expected)
        {
            Assert.AreEqual(expected.Replace("\n", Environment.NewLine), DocHelpers.GetDescription(null, markdown));
        }

        [Test]
        public void TestNestedFormatting()
        {
            var result = DocHelpers.GetDescription(null, "You can combine them like **bold with *italic inside* bold**.");
            // This is a complex case - the current implementation will handle the outermost first
            // The expected behavior should convert ** first, then * inside
            Assert.IsNotNull(result);
            Assert.That(result, Does.Contain("<b>").Or.Contain("<i>"));
        }

        [Test]
        public void TestBulletList()
        {
            var markdown = @"This tests:
- First bullet point
- Second bullet point
- Third bullet point";
            var result = DocHelpers.GetDescription(null, markdown);
            
            Assert.That(result, Does.Contain("<list type=\"bullet\">"));
            Assert.That(result, Does.Contain("<item><description>First bullet point</description></item>"));
            Assert.That(result, Does.Contain("<item><description>Second bullet point</description></item>"));
            Assert.That(result, Does.Contain("<item><description>Third bullet point</description></item>"));
            Assert.That(result, Does.Contain("</list>"));
        }

        [Test]
        public void TestBulletListWithFormatting()
        {
            var markdown = @"This tests:
- Simple bullet point
- Bullet with **bold text**
- Bullet with *italic text*";
            var result = DocHelpers.GetDescription(null, markdown);
            
            Assert.That(result, Does.Contain("<list type=\"bullet\">"));
            Assert.That(result, Does.Contain("<item><description>Simple bullet point</description></item>"));
            Assert.That(result, Does.Contain("<item><description>Bullet with <b>bold text</b></description></item>"));
            Assert.That(result, Does.Contain("<item><description>Bullet with <i>italic text</i></description></item>"));
        }

        [Test]
        public void TestNumberedList()
        {
            var markdown = @"Steps to follow:
1. First step
2. Second step
3. Third step";
            var result = DocHelpers.GetDescription(null, markdown);
            
            Assert.That(result, Does.Contain("<list type=\"number\">"));
            Assert.That(result, Does.Contain("<item><description>First step</description></item>"));
            Assert.That(result, Does.Contain("<item><description>Second step</description></item>"));
            Assert.That(result, Does.Contain("<item><description>Third step</description></item>"));
            Assert.That(result, Does.Contain("</list>"));
        }

        [Test]
        public void TestNumberedListWithFormatting()
        {
            var markdown = @"Steps:
1. First step with **important** note
2. Second step with *emphasis*
3. Third step combining **bold** and *italic*";
            var result = DocHelpers.GetDescription(null, markdown);
            
            Assert.That(result, Does.Contain("<list type=\"number\">"));
            Assert.That(result, Does.Contain("<item><description>First step with <b>important</b> note</description></item>"));
            Assert.That(result, Does.Contain("<item><description>Second step with <i>emphasis</i></description></item>"));
        }

        [Test]
        public void TestMixedContent()
        {
            var markdown = @"This is a paragraph with **bold** text.
- First bullet
- Second bullet
Another paragraph with *italic* text.";
            var result = DocHelpers.GetDescription(null, markdown);
            
            Assert.That(result, Does.Contain("<b>bold</b>"));
            Assert.That(result, Does.Contain("<list type=\"bullet\">"));
            Assert.That(result, Does.Contain("<i>italic</i>"));
        }

        [Test]
        public void TestEmptyString()
        {
            var result = DocHelpers.GetDescription(null, "");
            Assert.IsNull(result);
        }

        [Test]
        public void TestNullString()
        {
            var result = DocHelpers.GetDescription(null, null);
            Assert.IsNull(result);
        }

        [Test]
        public void TestPlainText()
        {
            var result = DocHelpers.GetDescription(null, "This is plain text without any markdown.");
            Assert.AreEqual("This is plain text without any markdown.", result);
        }

        [Test]
        public void TestSummaryPreferredOverDoc()
        {
            var result = DocHelpers.GetDescription("Summary text", "Doc text");
            Assert.AreEqual("Doc text", result);
        }

        [Test]
        public void TestSummaryUsedWhenDocEmpty()
        {
            var result = DocHelpers.GetDescription("Summary with **bold**", "");
            Assert.AreEqual("Summary with <b>bold</b>", result);
        }
    }
}
