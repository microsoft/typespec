using System.Text.Json;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputClientApiVersionsTests
    {
        [Test]
        public void InputClient_CanReadApiVersionsFromJson()
        {
            // Arrange
            var json = @"{
  ""$id"": ""1"",
  ""name"": ""TestClient"",
  ""namespace"": ""TestNamespace"",
  ""crossLanguageDefinitionId"": ""TestNamespace.TestClient"",
  ""summary"": ""Test client for API versions"",
  ""doc"": ""Test client documentation"",
  ""methods"": [],
  ""parameters"": [],
  ""parent"": null,
  ""children"": [],
  ""decorators"": [],
  ""apiVersions"": [
    ""2024-01-01"",
    ""2024-06-01-preview""
  ]
}";

            // Act
            var client = JsonSerializer.Deserialize<InputClient>(json, TypeSpecSerialization.JsonSerializerOptions);

            // Assert
            Assert.IsNotNull(client);
            Assert.AreEqual("TestClient", client.Name);
            Assert.AreEqual("TestNamespace", client.Namespace);
            Assert.AreEqual("TestNamespace.TestClient", client.CrossLanguageDefinitionId);
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(2, client.ApiVersions.Count);
            Assert.Contains("2024-01-01", client.ApiVersions.ToList());
            Assert.Contains("2024-06-01-preview", client.ApiVersions.ToList());
        }

        [Test]
        public void InputClient_HandlesNullApiVersions()
        {
            // Arrange
            var json = @"{
  ""$id"": ""1"",
  ""name"": ""TestClient"",
  ""namespace"": ""TestNamespace"",
  ""crossLanguageDefinitionId"": ""TestNamespace.TestClient"",
  ""summary"": ""Test client"",
  ""doc"": ""Test client documentation"",
  ""methods"": [],
  ""parameters"": [],
  ""parent"": null,
  ""children"": [],
  ""decorators"": []
}";

            // Act
            var client = JsonSerializer.Deserialize<InputClient>(json, TypeSpecSerialization.JsonSerializerOptions);

            // Assert
            Assert.IsNotNull(client);
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(0, client.ApiVersions.Count);
        }

        [Test]
        public void InputClient_HandlesEmptyApiVersions()
        {
            // Arrange
            var json = @"{
  ""$id"": ""1"",
  ""name"": ""TestClient"",
  ""namespace"": ""TestNamespace"",
  ""crossLanguageDefinitionId"": ""TestNamespace.TestClient"",
  ""summary"": ""Test client"",
  ""doc"": ""Test client documentation"",
  ""methods"": [],
  ""parameters"": [],
  ""parent"": null,
  ""children"": [],
  ""decorators"": [],
  ""apiVersions"": []
}";

            // Act
            var client = JsonSerializer.Deserialize<InputClient>(json, TypeSpecSerialization.JsonSerializerOptions);

            // Assert
            Assert.IsNotNull(client);
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(0, client.ApiVersions.Count);
        }

        [Test]
        public void InputClient_Constructor_SetsApiVersions()
        {
            // Arrange
            var apiVersions = new[] { "2024-01-01", "2024-06-01-preview" };

            // Act
            var client = new InputClient(
                "TestClient",
                "TestNamespace", 
                "TestNamespace.TestClient",
                "Test summary",
                "Test documentation",
                [],
                [],
                null,
                null,
                apiVersions);

            // Assert
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(2, client.ApiVersions.Count);
            Assert.Contains("2024-01-01", client.ApiVersions.ToList());
            Assert.Contains("2024-06-01-preview", client.ApiVersions.ToList());
        }

        [Test]
        public void InputClient_Constructor_HandlesNullApiVersions()
        {
            // Act
            var client = new InputClient(
                "TestClient",
                "TestNamespace", 
                "TestNamespace.TestClient",
                "Test summary",
                "Test documentation",
                [],
                [],
                null,
                null,
                null);

            // Assert
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(0, client.ApiVersions.Count);
        }

        [Test]
        public void InputClient_DefaultConstructor_HasEmptyApiVersions()
        {
            // Act
            var client = new InputClient();

            // Assert
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(0, client.ApiVersions.Count);
        }
    }
}