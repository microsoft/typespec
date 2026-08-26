// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Expressions
{
    public class PositionalParameterReferenceExpressionTests
    {
        [Test]
        public void NonKeywordParameterName()
        {
            var expression = new PositionalParameterReferenceExpression("myParam", ValueExpression.Empty);
            using CodeWriter writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual("myParam: ", writer.ToString(false));
        }

        [Test]
        public void KeywordParameterNameFromPropertyIsEscaped()
        {
            // Simulates the realistic flow: a property named "Object" becomes
            // parameter name "object" via ToIdentifierName, which is a C# keyword.
            var paramName = "Object".ToIdentifierName(useCamelCase: true);
            Assert.AreEqual("object", paramName);

            var expression = new PositionalParameterReferenceExpression(paramName, ValueExpression.Empty);
            using CodeWriter writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual("@object: ", writer.ToString(false));
        }

        // Validates that all C# keywords and contextual keywords are properly escaped
        // with the '@' prefix when used as named argument identifiers.
        [TestCase("abstract")]
        [TestCase("add")]
        [TestCase("alias")]
        [TestCase("as")]
        [TestCase("ascending")]
        [TestCase("async")]
        [TestCase("await")]
        [TestCase("base")]
        [TestCase("bool")]
        [TestCase("break")]
        [TestCase("by")]
        [TestCase("byte")]
        [TestCase("case")]
        [TestCase("catch")]
        [TestCase("char")]
        [TestCase("checked")]
        [TestCase("class")]
        [TestCase("const")]
        [TestCase("continue")]
        [TestCase("decimal")]
        [TestCase("default")]
        [TestCase("delegate")]
        [TestCase("descending")]
        [TestCase("do")]
        [TestCase("double")]
        [TestCase("else")]
        [TestCase("enum")]
        [TestCase("equals")]
        [TestCase("event")]
        [TestCase("explicit")]
        [TestCase("extern")]
        [TestCase("false")]
        [TestCase("finally")]
        [TestCase("fixed")]
        [TestCase("float")]
        [TestCase("for")]
        [TestCase("foreach")]
        [TestCase("from")]
        [TestCase("get")]
        [TestCase("global")]
        [TestCase("goto")]
        [TestCase("if")]
        [TestCase("implicit")]
        [TestCase("in")]
        [TestCase("int")]
        [TestCase("interface")]
        [TestCase("internal")]
        [TestCase("into")]
        [TestCase("is")]
        [TestCase("join")]
        [TestCase("let")]
        [TestCase("lock")]
        [TestCase("long")]
        [TestCase("nameof")]
        [TestCase("namespace")]
        [TestCase("new")]
        [TestCase("null")]
        [TestCase("object")]
        [TestCase("on")]
        [TestCase("operator")]
        [TestCase("out")]
        [TestCase("override")]
        [TestCase("params")]
        [TestCase("partial")]
        [TestCase("private")]
        [TestCase("protected")]
        [TestCase("public")]
        [TestCase("readonly")]
        [TestCase("ref")]
        [TestCase("remove")]
        [TestCase("return")]
        [TestCase("sbyte")]
        [TestCase("sealed")]
        [TestCase("set")]
        [TestCase("short")]
        [TestCase("sizeof")]
        [TestCase("stackalloc")]
        [TestCase("static")]
        [TestCase("string")]
        [TestCase("struct")]
        [TestCase("switch")]
        [TestCase("this")]
        [TestCase("throw")]
        [TestCase("true")]
        [TestCase("try")]
        [TestCase("typeof")]
        [TestCase("uint")]
        [TestCase("ulong")]
        [TestCase("unchecked")]
        [TestCase("unmanaged")]
        [TestCase("unsafe")]
        [TestCase("ushort")]
        [TestCase("using")]
        [TestCase("var")]
        [TestCase("virtual")]
        [TestCase("void")]
        [TestCase("volatile")]
        [TestCase("when")]
        [TestCase("where")]
        [TestCase("while")]
        [TestCase("yield")]
        public void CSharpKeywordParameterNameIsEscaped(string keyword)
        {
            var expression = new PositionalParameterReferenceExpression(keyword, ValueExpression.Empty);
            using CodeWriter writer = new CodeWriter();
            expression.Write(writer);

            Assert.AreEqual($"@{keyword}: ", writer.ToString(false));
        }
    }
}
