// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    public class CSharpProjectWriterTests
    {
        [Test]
        public void GenerateDocumentationFile_ShouldBeWrittenToProjectFile()
        {
            // Arrange
            var writer = new CSharpProjectWriter()
            {
                Description = "Test project description",
                AssemblyTitle = "Test Assembly Title", 
                Version = "1.0.0",
                PackageTags = "test",
                TargetFrameworks = "netstandard2.0;net8.0",
                LangVersion = "latest",
                GenerateDocumentationFile = true,
            };
            
            // Act
            var projectContent = writer.Write();
            
            // Assert
            Assert.IsTrue(projectContent.Contains("<GenerateDocumentationFile>true</GenerateDocumentationFile>"),
                $"Expected GenerateDocumentationFile to be true, but project content was:\n{projectContent}");
        }
    }
}