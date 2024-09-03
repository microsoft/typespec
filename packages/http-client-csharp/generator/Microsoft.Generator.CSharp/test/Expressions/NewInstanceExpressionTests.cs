// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    internal class NewInstanceExpressionTests
    {
        public NewInstanceExpressionTests()
        {
            MockHelpers.LoadMockPlugin();
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
            InputEnumType enumType = InputFactory.Enum("MyEnum", InputPrimitiveType.String, isExtensible: true, values:
            [
                InputFactory.EnumMember.Int32("One", 1),
                InputFactory.EnumMember.Int32("Two", 2)
            ]);
            var provider = CodeModelPlugin.Instance.TypeFactory.CreateEnum(enumType);
            Assert.NotNull(provider);
            var expr = New.Instance(provider!.Type, Literal("three"));
            using CodeWriter writer = new CodeWriter();
            expr.Write(writer);
            Assert.AreEqual("new global::Sample.Models.MyEnum(\"three\")", writer.ToString(false));
        }
    }
}
