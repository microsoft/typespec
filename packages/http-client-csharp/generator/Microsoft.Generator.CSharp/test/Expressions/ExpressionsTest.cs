// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using Moq;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    internal class ExpressionsTest
    {
        private readonly string _mocksFolder = "Mocks";

        [OneTimeSetUp]
        public void Setup()
        {
            Mock<ExtensibleSnippets> extensibleSnippets = new Mock<ExtensibleSnippets>();
            string outputFolder = "./outputFolder";
            string projectPath = outputFolder;

            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the singleton instance of the plugin
            _ = new MockCodeModelPlugin(new GeneratorContext(Configuration.Load(configFilePath)));
        }

        [Test]
        public void TestInvokeInstanceMethodExpression()
        {
            // declare the instance method
            var mockTypeProvider = new Mock<TypeProvider>();
            var barMethod = new MethodProvider(
                new MethodSignature(
                    Name: "Bar",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: typeof(bool),
                    Parameters: [
                        new ParameterProvider("p1", $"p1", new CSharpType(typeof(bool))),
                        new ParameterProvider("p2", $"p2", new CSharpType(typeof(bool))),
                        new ParameterProvider("p3", $"p3", new CSharpType(typeof(bool)))
                    ],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { Return(True) },
                mockTypeProvider.Object);
            var returnInstanceMethod = Return(new InvokeInstanceMethodExpression(null, barMethod.Signature.Name, [Bool(true), Bool(false), Bool(false)]));
            var fooMethod = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: typeof(bool),
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { returnInstanceMethod },
                mockTypeProvider.Object);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(barMethod);
            writer.WriteMethod(fooMethod);

            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
        }

        [Test]
        public void TestNewInstanceExpression()
        {
            // declare the instance method
            var mockTypeProvider = new Mock<TypeProvider>();
            var newInstanceExpression = new NewInstanceExpression(new CSharpType(typeof(object)), []);
            var variableX = new VariableReferenceSnippet(typeof(object), "x");
            var xDeclaration = Declare(variableX, newInstanceExpression);
            var fooMethod = new MethodProvider(
                new MethodSignature(
                    Name: "Foo",
                    Modifiers: MethodSignatureModifiers.Public,
                    ReturnType: null,
                    Parameters: [],
                    Description: null, ReturnDescription: null),
                new MethodBodyStatement[] { xDeclaration },
                mockTypeProvider.Object);

            // Verify the expected behavior
            using var writer = new CodeWriter();
            writer.WriteMethod(fooMethod);

            var expectedResult = Helpers.GetExpectedFromFile();
            var test = writer.ToString(false);
            Assert.AreEqual(expectedResult, test);
        }
    }
}
