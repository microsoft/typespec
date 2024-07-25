// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class CSharpGenTests
    {
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
            MockHelpers.LoadMockPlugin();
            var csharpGen = new CSharpGen();

            Assert.DoesNotThrowAsync(async () => await csharpGen.ExecuteAsync());
        }

        [Test]
        public void VisitorsAreVisited()
        {
            var mockOutputLibrary = new Mock<OutputLibrary>();
            MockHelpers.LoadMockPlugin(createOutputLibrary: () => mockOutputLibrary.Object);
            var mockOutputLibraryVisitor = new Mock<OutputLibraryVisitor>();

            mockOutputLibrary.Protected()
                .Setup<IEnumerable<OutputLibraryVisitor>>("GetOutputLibraryVisitors")
                .Returns(new List<OutputLibraryVisitor> { mockOutputLibraryVisitor.Object });
            var csharpGen = new CSharpGen();

            Assert.DoesNotThrowAsync(async () => await csharpGen.ExecuteAsync());
            mockOutputLibrary.Verify(m => m.GetOutputLibraryVisitors(), Times.Once);
            mockOutputLibraryVisitor.Verify(m => m.Visit(mockOutputLibrary.Object), Times.Once);
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
