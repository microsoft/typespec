// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Snippets
{
    public class TypedSnippetsTests
    {
        private readonly string _mocksFolder = "Mocks";

        [OneTimeSetUp]
        public void Setup()
        {
            string outputFolder = "./outputFolder";
            string projectPath = outputFolder;
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the singleton instance of the plugin
            _ = new MockCodeModelPlugin(new GeneratorContext(Configuration.Load(configFilePath)));
        }

        [Test]
        public void ConvertSnippet_InvokeToDouble()
        {
            var arg = Snippet.Literal("2.0");
            InvokeStaticMethodExpression result = ConvertSnippet.InvokeToDouble(arg);

            Assert.IsNotNull(result.MethodType);
            Assert.AreEqual(new CSharpType(typeof(Convert)), result.MethodType);
            Assert.AreEqual(nameof(Convert.ToDouble), result.MethodName);
        }

        [Test]
        public void ConvertSnippet_InvokeToInt32()
        {
            var arg = Snippet.Literal("2");
            InvokeStaticMethodExpression result = ConvertSnippet.InvokeToInt32(arg);

            Assert.IsNotNull(result.MethodType);
            Assert.AreEqual(new CSharpType(typeof(Convert)), result.MethodType);
            Assert.AreEqual(nameof(Convert.ToInt32), result.MethodName);
        }

        [Test]
        public void ArgumentSnippet_AssertNotNull()
        {
            using CodeWriter writer = new CodeWriter();
            var p = new ParameterProvider("p1", $"p1", new CSharpType(typeof(bool)));


            ArgumentSnippet.AssertNotNull(p).Write(writer);
            Assert.AreEqual("global::sample.namespace.Argument.AssertNotNull(p1, nameof(p1));\n", writer.ToString(false));
        }
    }
}
