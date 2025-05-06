// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Moq;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class CSharpGenTests
    {
        // Validates that a valid generator implementation is accepted
        [Test]
        public void TestCSharpGen_ValidGenerator()
        {
            MockHelpers.LoadMockGenerator();
            var csharpGen = new CSharpGen();

            Assert.DoesNotThrowAsync(async () => await csharpGen.ExecuteAsync());
        }

        [Test]
        public void VisitorsAreVisited()
        {
            var mockVisitor = new Mock<LibraryVisitor>();

            var mockGenerator = MockHelpers.LoadMockGenerator();
            mockGenerator.Object.AddVisitor(mockVisitor.Object);

            var csharpGen = new CSharpGen();

            Assert.DoesNotThrowAsync(async () => await csharpGen.ExecuteAsync());
            mockVisitor.Verify(m => m.Visit(mockGenerator.Object.OutputLibrary), Times.Once);
        }
    }
}
