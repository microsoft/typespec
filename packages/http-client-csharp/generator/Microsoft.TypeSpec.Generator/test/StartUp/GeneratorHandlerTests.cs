// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Moq;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.StartUp
{
    public class GeneratorHandlerTests
    {
        [Test]
        public void SelectGeneratorFindsMatchingGenerator()
        {
            var generatorHandler = new GeneratorHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.GeneratorName).Returns("MockGenerator");
            var mockGenerator = new Mock<CodeModelGenerator>();

            generatorHandler.Generators = new List<System.Lazy<CodeModelGenerator, IMetadata>>
            {
                new(() => mockGenerator.Object, metadataMock.Object),
            };
            CommandLineOptions options = new() { GeneratorName = "MockGenerator" };

            Assert.DoesNotThrow(() => generatorHandler.SelectGenerator(options));
            mockGenerator.Verify(p => p.Configure(), Times.Once);
        }

        [Test]
        public void SelectGeneratorThrowsWhenNoMatch()
        {
            var generatorHandler = new GeneratorHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.GeneratorName).Returns("MockGenerator");
            var mockGenerator = new Mock<CodeModelGenerator>();

            generatorHandler.Generators = new List<System.Lazy<CodeModelGenerator, IMetadata>>
            {
                new(() => mockGenerator.Object, metadataMock.Object),
            };
            CommandLineOptions options = new() { GeneratorName = "NonExistentGenerator" };

            Assert.Throws<System.InvalidOperationException>(() => generatorHandler.SelectGenerator(options));
            mockGenerator.Verify(p => p.Configure(), Times.Never);
        }
    }
}
