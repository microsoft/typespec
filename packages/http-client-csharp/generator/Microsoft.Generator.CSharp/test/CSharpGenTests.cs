// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Input;
using Moq;
using Moq.Protected;
using NUnit.Framework;

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
            var parsedOutputPath = CSharpGen.ParseGeneratedSourceOutputPath(outputPath);
            var expectedPath = Path.Combine(outputPath, "src", "Generated");
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
            var parsedOutputPath = CSharpGen.ParseGeneratedSourceOutputPath(outputPath);
            var expectedPath = Path.Combine("src", "Generated");
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

            mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns(new CSharpType(typeof(IList<>)));
            mockPlugin.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            var configFilePath = Path.Combine(_mocksFolder, "Configuration.json");
            var csharpGen = new CSharpGen().ExecuteAsync();

            Assert.IsNotNull(csharpGen);
        }

        private void TestOutputPathAppended(string outputPath, string expectedPath)
        {
            var srcPath = "src";

            outputPath = Path.Combine(outputPath, srcPath);


            var parsedOutputPath = CSharpGen.ParseGeneratedSourceOutputPath(outputPath);

            var areEqual = string.Equals(expectedPath, parsedOutputPath, StringComparison.OrdinalIgnoreCase);

            Assert.IsTrue(areEqual);
        }
    }
}
