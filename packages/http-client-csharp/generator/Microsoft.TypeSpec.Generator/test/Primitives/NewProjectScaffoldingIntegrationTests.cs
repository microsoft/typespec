// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests;

namespace Microsoft.TypeSpec.Generator.Tests.Primitives
{
    public class NewProjectScaffoldingIntegrationTests
    {
        [Test]
        public void GenerateDocumentationFile_WhenXmlDocsDisabled_ShouldBeFalse()
        {
            // Arrange  
            var configJson = """
                {
                    "package-name": "TestPackage",
                    "disable-xml-docs": true
                }
                """;
                
            MockHelpers.LoadMockGenerator(configuration: configJson);
            var scaffolding = new TestableNewProjectScaffolding();
            
            // Act
            var projectContent = scaffolding.GetSourceProjectFileContentPublic();
            
            // Assert
            Assert.IsTrue(projectContent.Contains("<GenerateDocumentationFile>false</GenerateDocumentationFile>"),
                $"Expected GenerateDocumentationFile to be false when DisableXmlDocs is true, but project content was:\n{projectContent}");
        }

        [Test]
        public void GenerateDocumentationFile_WhenXmlDocsEnabled_ShouldBeTrue()
        {
            // Arrange
            var configJson = """
                {
                    "package-name": "TestPackage",
                    "disable-xml-docs": false
                }
                """;
                
            MockHelpers.LoadMockGenerator(configuration: configJson);
            var scaffolding = new TestableNewProjectScaffolding();
            
            // Act
            var projectContent = scaffolding.GetSourceProjectFileContentPublic();
            
            // Assert  
            Assert.IsTrue(projectContent.Contains("<GenerateDocumentationFile>true</GenerateDocumentationFile>"),
                $"Expected GenerateDocumentationFile to be true when DisableXmlDocs is false, but project content was:\n{projectContent}");
        }

        // Test wrapper to expose protected method
        private class TestableNewProjectScaffolding : NewProjectScaffolding
        {
            public string GetSourceProjectFileContentPublic() => GetSourceProjectFileContent();
        }
    }
}