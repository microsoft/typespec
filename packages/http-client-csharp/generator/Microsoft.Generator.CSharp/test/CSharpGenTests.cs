// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Snippets;
using Moq;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.ExtensibleSnippets;

namespace Microsoft.Generator.CSharp.Tests
{
    public class CSharpGenTests
    {
        private readonly string _mocksFolder = "./Mocks";
        // Validates that the output path is parsed correctly when provided
        [Test]
        public void TestGetOutputPath_OutputPathProvided()
        {
            var outputPath = "./outputDir";
            var parsedOutputPath = CSharpGen.ParseOutputPath(outputPath).Replace("\\", "/");
            var expectedPath = $"{outputPath}/src";
            var areEqual = string.Equals(expectedPath, parsedOutputPath, StringComparison.OrdinalIgnoreCase);

            Assert.IsTrue(areEqual);

            // append 'src' to the output path and validate that it is not appended again
            TestOutputPathAppended(outputPath, expectedPath);
        }

        // Validates that the output path is parsed correctly when an empty string is provided
        [Test]
        public void TestGetConfigurationInputFilePath_DefaultPath()
        {
            var outputPath = "";
            var parsedOutputPath = CSharpGen.ParseOutputPath(outputPath).Replace("\\", "/");
            var expectedPath = $"src";
            var areEqual = string.Equals(expectedPath, parsedOutputPath, StringComparison.OrdinalIgnoreCase);

            Assert.IsTrue(areEqual);
        }

        // Validates that a valid plugin implementation is accepted
        [Test]
        public void TestCSharpGen_ValidPlugin()
        {
            // mock plugin
            var mockPlugin = new Mock<CodeModelPlugin>(new GeneratorContext(Configuration.Load(_mocksFolder)))
            {
                CallBase = true
            };

            // mock type factory
            var mockTypeFactory = new Mock<TypeFactory>()
            {
                CallBase = true
            };

            // mock api types
            var mockApiTypes = new Mock<ApiTypes>()
            {
                CallBase = true
            };

            // mock extensible snippets
            var mockExtensibleSnippets = new Mock<ExtensibleSnippets>()
            {
                CallBase = true
            };

            mockTypeFactory.Setup(p => p.CreateCSharpType(It.IsAny<InputType>())).Returns(new CSharpType(typeof(IList<>)));
            mockExtensibleSnippets.SetupGet(p => p.Model).Returns(new Mock<ModelSnippets>().Object);
            mockPlugin.SetupGet(p => p.ApiTypes).Returns(mockApiTypes.Object);
            mockPlugin.SetupGet(p => p.ExtensibleSnippets).Returns(mockExtensibleSnippets.Object);
            mockPlugin.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            var configFilePath = Path.Combine(_mocksFolder, "Configuration.json");
            var csharpGen = new CSharpGen().ExecuteAsync();

            Assert.IsNotNull(csharpGen);
        }

        private void TestOutputPathAppended(string outputPath, string expectedPath)
        {
            var srcPath = "/src";

            outputPath += srcPath;


            var parsedOutputPath = CSharpGen.ParseOutputPath(outputPath);
            var cleanedOutputPath = parsedOutputPath.Replace("\\", "/");

            var areEqual = string.Equals(expectedPath, cleanedOutputPath, StringComparison.OrdinalIgnoreCase);

            Assert.IsTrue(areEqual);
        }
    }
}
