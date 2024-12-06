// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class CSharpGenTests
    {
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
            var mockVisitor = new Mock<LibraryVisitor>();

            var mockPlugin = MockHelpers.LoadMockPlugin();
            mockPlugin.Object.AddVisitor(mockVisitor.Object);

            var csharpGen = new CSharpGen();

            Assert.DoesNotThrowAsync(async () => await csharpGen.ExecuteAsync());
            mockVisitor.Verify(m => m.Visit(mockPlugin.Object.OutputLibrary), Times.Once);
        }
    }
}
