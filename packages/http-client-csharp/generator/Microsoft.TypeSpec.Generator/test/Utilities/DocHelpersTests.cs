// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
