// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class CodeWriterExtensionTests
    {
        private readonly string _mocksFolder = "Mocks";
        private readonly string _licenseString = "// License string";
        private readonly string _autoGenerated = "// <auto-generated/>";
        private readonly string _nullableDisable = "#nullable disable";
        private string? _header;

        [OneTimeSetUp]
        public void Setup()
        {
            Mock<ApiTypes> apiTypes = new Mock<ApiTypes>();
            Mock<ExtensibleSnippets> extensibleSnippets = new Mock<ExtensibleSnippets>();
            apiTypes.SetupGet(x => x.ResponseParameterName).Returns("result");

            string outputFolder = "./outputFolder";
            string projectPath = outputFolder;

            _header = new StringBuilder()
                .Append(_licenseString).Append(CodeWriterTests.NewLine)
                .Append(CodeWriterTests.NewLine)
                .Append(_autoGenerated).Append(CodeWriterTests.NewLine)
                .Append(CodeWriterTests.NewLine)
                .Append(_nullableDisable).Append(CodeWriterTests.NewLine)
                .Append(CodeWriterTests.NewLine)
                .ToString();

            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the singleton instance of the plugin
            _ = new MockCodeModelPlugin(new GeneratorContext(Configuration.Load(configFilePath)));
        }

        // Test that an exception is not thrown when the extension methods are null.
        [Test]
        public void NoExtensionMethods()
        {
            var writer = new CodeWriter();
            Assert.IsNotNull(writer);
        }

        // Test the Write method for a cast expression using the default implementation.
        [TestCase(typeof(int), 22.2, "((int)22.2)")]
        [TestCase(typeof(double), 22, "((double)22)")]
        [TestCase(typeof(string), 22, "((string)22)")]
        public void TestWriteValueExpression_DefaultCastExpression(Type type, object inner, string expectedWritten)
        {
            var castExpression = new CastExpression(Snippet.Literal(inner), type);
            var codeWriter = new CodeWriter();
            castExpression.Write(codeWriter);

            var sb = new StringBuilder();
            sb.Append(_header);
            sb.Append(expectedWritten).Append(CodeWriterTests.NewLine);

            Assert.AreEqual(sb.ToString(), codeWriter.ToString());
        }

        // Test the Write method for a custom expression.
        [Test]
        public void TestWriteValueExpression_CustomExpression()
        {
            var mockCastExpression = new MockExpression();
            var codeWriter = new CodeWriter();
            mockCastExpression.Write(codeWriter);

            var sb = new StringBuilder();
            sb.Append(_header);
            sb.Append("Custom implementation").Append(CodeWriterTests.NewLine);

            Assert.AreEqual(sb.ToString(), codeWriter.ToString());
        }

        // Test the Write method for a CollectionInitializerExpression using the default implementation.
        [TestCase("foo", "{ \"foo\" }")]
        [TestCase("bar", "{ \"bar\" }")]
        public void TestWriteValueExpression_DefaultCollectionInitializerExpression(string literal, string expectedWritten)
        {
            var stringLiteralExpression = Snippet.Literal(literal);
            CollectionInitializerExpression expression = new CollectionInitializerExpression(stringLiteralExpression);
            var codeWriter = new CodeWriter();
            expression.Write(codeWriter);

            var sb = new StringBuilder();
            sb.Append(_header);
            sb.Append(expectedWritten).Append(CodeWriterTests.NewLine);

            Assert.AreEqual(sb.ToString(), codeWriter.ToString());
        }

        // Construct a mock method with a body. The body can be either a list of statements or a single expression
        // depending on the value of the useExpressionAsBody parameter.
        private static CSharpMethod ConstructMockMethod()
        {
            // create method signature
            var methodName = "TestMethod";
            FormattableString summary = $"Sample summary for {methodName}";
            FormattableString description = $"Sample description for {methodName}";
            FormattableString returnDescription = $"Sample return description for {methodName}";
            var methodSignatureModifiers = MethodSignatureModifiers.Public;
            var returnType = new CSharpType(typeof(BinaryData));
            var parameters = new List<Parameter>()
            {
                new Parameter("param1", $"Sample description for param1", new CSharpType(typeof(string)), null, Validation: ParameterValidationType.AssertNotNullOrEmpty, Initializer: null)
            };

            var responseVar = new VariableReferenceSnippet(returnType, "responseParamName");
            var responseRef = Snippet.Var(responseVar, BinaryDataSnippet.FromBytes(Snippet.Literal("sample response")));
            var resultStatements = new List<MethodBodyStatement>()
            {
                responseRef,
                new KeywordStatement("return", responseVar)
            };

            var method = new CSharpMethod
            (
                new MethodSignature(methodName, summary, description, methodSignatureModifiers, returnType, returnDescription, parameters),
                resultStatements,
                "GET"
            );

            return method;
        }
    }
}
