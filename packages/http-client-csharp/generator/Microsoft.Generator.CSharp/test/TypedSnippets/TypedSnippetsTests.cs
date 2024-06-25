// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System;
using Microsoft.Generator.CSharp.Snippets;
using Moq;
using NUnit.Framework;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests.Snippets
{
    public class TypedSnippetsTests
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
        public void AssertNotNull()
        {
            using CodeWriter writer = new CodeWriter();
            var p = new ParameterProvider("p1", $"p1", new CSharpType(typeof(bool)));


            ArgumentSnippet.AssertNotNull(p).Write(writer);
            Assert.AreEqual("global::sample.namespace.Argument.AssertNotNull(p1, nameof(p1));\n", writer.ToString(false));
        }
    }
}
