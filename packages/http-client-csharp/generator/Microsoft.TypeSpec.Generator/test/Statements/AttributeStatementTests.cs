// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Statements
{
    public class AttributeStatementTests
    {
        public AttributeStatementTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void AttributeStatementWithNoArgument()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute));

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithOneArgument()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), Literal("This is obsolete"));

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithMultipleArguments()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), Literal("This is obsolete"), Literal(true));

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithOneNamedArgument()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute),
                [
                    new KeyValuePair<string, ValueExpression>("DiagnosticId", Literal("TypeSpecGenerator001"))
                ]);

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithNamedArguments()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute),
                [
                    new KeyValuePair<string, ValueExpression>("DiagnosticId", Literal("TypeSpecGenerator001")),
                    new KeyValuePair<string, ValueExpression>("UrlFormat", Literal("my-format"))
                ]);

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }

        [Test]
        public void AttributeStatementWithArgumentsAndNamedArguments()
        {
            var attributeStatement = new AttributeStatement(typeof(ObsoleteAttribute), [Literal("This is obsolete"), Literal(true)],
                [
                    new KeyValuePair<string, ValueExpression>("DiagnosticId", Literal("TypeSpecGenerator001")),
                    new KeyValuePair<string, ValueExpression>("UrlFormat", Literal("my-format"))
                ]);

            using var writer = new CodeWriter();
            attributeStatement.Write(writer);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }
    }
}
