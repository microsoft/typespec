// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Statements
{
    public class AttributeStatementTests
    {
        public AttributeStatementTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void AttributeStatementWithNoArgument()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute));

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithOneArgument()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), Literal("This is obsolete"));

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithMultipleArguments()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), Literal("This is obsolete"), Literal(true));

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithOneNamedArgument()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), new Dictionary<string, ValueExpression>
            {
                ["DiagnosticId"] = Literal("TypeSpecGenerator001")
            });

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithNamedArguments()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), new Dictionary<string, ValueExpression>
            {
                ["DiagnosticId"] = Literal("TypeSpecGenerator001"),
                ["UrlFormat"] = Literal("my-format")
            });

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithArgumentsAndNamedArguments()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), [Literal("This is obsolete"), Literal(true)], new Dictionary<string, ValueExpression>
            {
                ["DiagnosticId"] = Literal("TypeSpecGenerator001"),
                ["UrlFormat"] = Literal("my-format")
            });

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile().TrimEnd(), writer.ToString(false));
        }
    }
}
