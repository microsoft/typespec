// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Expressions
{
    internal class NewInstanceExpressionTests
    {
        public NewInstanceExpressionTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void ValidateAnonymousSingleLine()
        {
            using CodeWriter writer = new CodeWriter();
            new NewInstanceExpression(null, [], new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("key"), Literal(1) }
            },
            true)).Write(writer);
            Assert.AreEqual("new { key = 1 }", writer.ToString(false));
        }

        [Test]
        public void ValidateAnonymousWithPropertiesSingleLine()
        {
            using CodeWriter writer = new CodeWriter();
            new NewInstanceExpression(null, [], new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("key"), Literal(1) },
                { Identifier("value"), Literal(2) }
            },
            true)).Write(writer);
            Assert.AreEqual("new { key = 1, value = 2 }", writer.ToString(false));
        }

        [Test]
        public void ValidateNullableValueType()
        {
            InputEnumType enumType = InputFactory.Int32Enum("MyEnum", [
                ("One", 1),
                ("Two", 2)
            ], isExtensible: true);
            var provider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(enumType);
            Assert.NotNull(provider);
            var expr = New.Instance(provider!.Type, Literal("three"));
            using CodeWriter writer = new CodeWriter();
            expr.Write(writer);
            Assert.AreEqual("new global::Sample.Models.MyEnum(\"three\")", writer.ToString(false));
        }

        [Test]
        public void ValidateObjectInitializerMultilineFormat()
        {
            using CodeWriter writer = new CodeWriter();
            var type = typeof(object);
            var objInit = new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>
            {
                { Identifier("Property1"), Literal("value1") },
                { Identifier("Property2"), Literal("value2") }
            }, false); // multiline
            var expr = new NewInstanceExpression(type, [], objInit);
            expr.Write(writer);
            writer.AppendRaw(";"); // Use AppendRaw instead of WriteRawLine to not add extra newline
            var result = writer.ToString(false);
            
            // Expected format should be:
            // new object
            // {
            //     Property1 = "value1",
            //     Property2 = "value2"
            // };
            // Without extra line breaks before the semicolon
            var expected = @"new object
{
    Property1 = ""value1"",
    Property2 = ""value2""
};";
            Assert.AreEqual(expected, result);
        }
    }
}
