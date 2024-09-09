// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Snippets
{
    public class SnippetTests
    {
        [Test]
        public void ValidateFloat()
        {
            using CodeWriter writer = new CodeWriter();
            Float(1.1f).Write(writer);
            Assert.AreEqual("1.1F", writer.ToString(false));
        }

        [Test]
        public void ValidateString()
        {
            using CodeWriter writer = new CodeWriter();
            Literal("testing").Write(writer);
            Assert.AreEqual("\"testing\"", writer.ToString(false));
        }

        [Test]
        public void ValidateStringU8()
        {
            using CodeWriter writer = new CodeWriter();
            LiteralU8("testing").Write(writer);
            Assert.AreEqual("\"testing\"u8", writer.ToString(false));
        }

        [Test]
        public void ValidateDictionary()
        {
            using CodeWriter writer = new CodeWriter();
            New.Dictionary(typeof(string), typeof(int)).Write(writer);
            Assert.AreEqual("new global::System.Collections.Generic.Dictionary<string, int>()", writer.ToString(false));
        }

        [Test]
        public void ValidateDictionaryWithValues()
        {
            using CodeWriter writer = new CodeWriter();
            New.Dictionary(typeof(string), typeof(int), new Dictionary<ValueExpression, ValueExpression>
            {
                { Literal("x"), Literal(1) },
                { Literal("y"), Literal(2) }
            }).Write(writer);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void ValidateAnonymousSingleProperty()
        {
            using CodeWriter writer = new CodeWriter();
            New.Anonymous(Identifier("key"), Literal(1)).Write(writer);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void ValidateAnonymousMultipleProperties()
        {
            using CodeWriter writer = new CodeWriter();
            New.Anonymous(new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("key"), Literal(1) },
                { Identifier("value"), Literal(2) }
            }).Write(writer);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void ValidateInstanceCtor()
        {
            var ctor = new ConstructorSignature(typeof(TestClass), null, MethodSignatureModifiers.Public, []);
            using CodeWriter writer = new CodeWriter();
            New.Instance(ctor, new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("X"), Literal(100) },
                { Identifier("Y"), Literal(200) }
            }).Write(writer);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void ValidateInstanceCtorWithArguments()
        {
            var xParam = new ParameterProvider("x", FormattableStringHelpers.Empty, typeof(int));
            var ctor = new ConstructorSignature(typeof(TestClass), null, MethodSignatureModifiers.Public, []);
            using CodeWriter writer = new CodeWriter();
            New.Instance(ctor, [Literal(20)], new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("Y"), Literal(200) }
            }).Write(writer);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void ValidateInstance()
        {
            using CodeWriter writer = new CodeWriter();
            New.Instance(new CSharpType(typeof(TestClass)), new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("X"), Literal(100) },
                { Identifier("Y"), Literal(200) }
            }).Write(writer);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void ValidateInstanceWithArguments()
        {
            using CodeWriter writer = new CodeWriter();
            New.Instance(new CSharpType(typeof(TestClass)), [Literal(20)]).Write(writer);
            Assert.AreEqual("new global::Microsoft.Generator.CSharp.Tests.Snippets.SnippetTests.TestClass(20)", writer.ToString(false));
        }

        [Test]
        public void ValidateFrameworkInstance()
        {
            using CodeWriter writer = new CodeWriter();
            New.Instance(typeof(TestClass), new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("X"), Literal(100) },
                { Identifier("Y"), Literal(200) }
            }).Write(writer);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void ValidateFrameworkInstanceWithArguments()
        {
            using CodeWriter writer = new CodeWriter();
            New.Instance(typeof(TestClass), [Literal(20)]).Write(writer);
            Assert.AreEqual("new global::Microsoft.Generator.CSharp.Tests.Snippets.SnippetTests.TestClass(20)", writer.ToString(false));
        }

        private class TestClass
        {
            public TestClass()
            {
                X = 1;
                Y = 2;
            }

            public TestClass(int x)
            {
                X = x;
                Y = 2;
            }

            public int X { get; set; }
            public int Y { get; set; }
        }
    }
}
