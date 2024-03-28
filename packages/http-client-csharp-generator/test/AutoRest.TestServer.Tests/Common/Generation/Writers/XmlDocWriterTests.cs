// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using NUnit.Framework;

namespace AutoRest.CSharp.Generation.Writers
{
    public class XmlDocWriterTests
    {
        private XmlDocWriter Writer;

        [SetUp]
        public void Setup()
        {
            Writer = new XmlDocWriter("test.xml");
        }

        [Test]
        public void EmptyContent()
        {
            Assert.AreEqual(@"<?xml version=""1.0"" encoding=""utf-8""?>
<doc>
  <members />
</doc>", Writer.ToString());
        }

        [Test]
        public void EmptyMember()
        {
            Writer.AddMember("foo");

            Assert.AreEqual(@"<?xml version=""1.0"" encoding=""utf-8""?>
<doc>
  <members>
    <member name=""foo"" />
  </members>
</doc>", Writer.ToString());
        }

        [Test]
        public void EmptyTag()
        {
            Writer.AddMember("foo");
            Writer.AddExamples(new[]
            {
                ("", "")
            });

            Assert.AreEqual(@"<?xml version=""1.0"" encoding=""utf-8""?>
<doc>
  <members>
    <member name=""foo"">
      <example>

<code></code></example>
    </member>
  </members>
</doc>", Writer.ToString());
        }

        [Test]
        public void OneTag()
        {
            Writer.AddMember("foo");
            Writer.AddExamples(new[]
            {
                ("test", "Hello, world!")
            });

            Assert.AreEqual(@"<?xml version=""1.0"" encoding=""utf-8""?>
<doc>
  <members>
    <member name=""foo"">
      <example>
test
<code>Hello, world!</code></example>
    </member>
  </members>
</doc>", Writer.ToString());
        }

        [Test]
        public void MultipleTags()
        {
            Writer.AddMember("foo");
            Writer.AddExamples(new[]
            {
                ("test", "Hello, world!"),
                ("test2", "Hello, world, again!")
            });

            Assert.AreEqual(@"<?xml version=""1.0"" encoding=""utf-8""?>
<doc>
  <members>
    <member name=""foo"">
      <example>
test
<code>Hello, world!</code>
test2
<code>Hello, world, again!</code></example>
    </member>
  </members>
</doc>", Writer.ToString());
        }

        [Test]
        public void MultipleMembers()
        {
            Writer.AddMember("foo");
            Writer.AddExamples(new[] {
                ("test", "Hello, world!"),
            });
            Writer.AddMember("fooAsync");
            Writer.AddExamples(new[] {
                ("test2", "Hello, world, again!"),
            });

            Assert.AreEqual(@"<?xml version=""1.0"" encoding=""utf-8""?>
<doc>
  <members>
    <member name=""foo"">
      <example>
test
<code>Hello, world!</code></example>
    </member>
    <member name=""fooAsync"">
      <example>
test2
<code>Hello, world, again!</code></example>
    </member>
  </members>
</doc>", Writer.ToString());
        }
    }
}
