// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Reflection;
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
            mockVisitor.Verify(m => m.VisitLibrary(mockGenerator.Object.OutputLibrary), Times.Once);
        }

        [Test]
        public void DeleteDirectoryDeletesGeneratedExtensionFilesUnlessExplicitlyKept()
        {
            var outputPath = Path.Combine(TestContext.CurrentContext.WorkDirectory, "CSharpGen", nameof(DeleteDirectoryDeletesGeneratedExtensionFilesUnlessExplicitlyKept));
            if (Directory.Exists(outputPath))
            {
                Directory.Delete(outputPath, recursive: true);
            }

            Directory.CreateDirectory(outputPath);
            var staleExtensionPath = Path.Combine(outputPath, "StaleExtensions.cs");
            var configurationPath = Path.Combine(outputPath, "Configuration.json");
            File.WriteAllText(staleExtensionPath, "// stale generated helper");
            File.WriteAllText(configurationPath, "{}");

            var deleteDirectory = typeof(CSharpGen).GetMethod("DeleteDirectory", BindingFlags.Static | BindingFlags.NonPublic)!;
            deleteDirectory.Invoke(null, [outputPath, new[] { "Configuration.json" }]);

            Assert.IsFalse(File.Exists(staleExtensionPath));
            Assert.IsTrue(File.Exists(configurationPath));
        }
    }
}
