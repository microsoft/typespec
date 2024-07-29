// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Writers
{
    public class CodeWriterExtensionTests
    {
        public CodeWriterExtensionTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        // Test that an exception is not thrown when the extension methods are null.
        [Test]
        public void NoExtensionMethods()
        {
            using var writer = new CodeWriter();
            Assert.IsNotNull(writer);
        }

        // Test the Write method for a cast expression using the default implementation.
        [TestCase(typeof(int), 22.2, "((int)22.2)")]
        [TestCase(typeof(double), 22, "((double)22)")]
        [TestCase(typeof(string), 22, "((string)22)")]
        public void TestWriteValueExpression_DefaultCastExpression(Type type, object inner, string expectedWritten)
        {
            var castExpression = new CastExpression(Snippet.Literal(inner), type);
            using var codeWriter = new CodeWriter();
            castExpression.Write(codeWriter);

            Assert.AreEqual(expectedWritten, codeWriter.ToString(false));
        }

        // Test the Write method for a custom expression.
        [Test]
        public void TestWriteValueExpression_CustomExpression()
        {
            var mockCastExpression = new TestExpression();
            using var codeWriter = new CodeWriter();
            mockCastExpression.Write(codeWriter);

            Assert.AreEqual("Custom implementation", codeWriter.ToString(false));
        }

        // Test the Write method for a CollectionInitializerExpression using the default implementation.
        [TestCase("foo", "{ \"foo\" }")]
        [TestCase("bar", "{ \"bar\" }")]
        public void TestWriteValueExpression_DefaultCollectionInitializerExpression(string literal, string expectedWritten)
        {
            var stringLiteralExpression = Snippet.Literal(literal);
            CollectionInitializerExpression expression = new CollectionInitializerExpression(stringLiteralExpression);
            using var codeWriter = new CodeWriter();
            expression.Write(codeWriter);

            Assert.AreEqual(expectedWritten, codeWriter.ToString(false));
        }
    }
}
