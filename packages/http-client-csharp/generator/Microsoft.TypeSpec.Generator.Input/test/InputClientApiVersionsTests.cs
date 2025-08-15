using System.Linq;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputClientApiVersionsTests
    {
        [Test]
        public void InputClient_ApiVersions_PropertyExists()
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
                [],
                apiVersions);

            // Assert
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(2, client.ApiVersions.Count);
            Assert.Contains("2024-01-01", client.ApiVersions.ToList());
            Assert.Contains("2024-06-01-preview", client.ApiVersions.ToList());
        }

        [Test]
        public void InputClient_ApiVersions_DefaultEmpty()
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
                [],
                null);

            // Assert
            Assert.IsNotNull(client.ApiVersions);
            Assert.AreEqual(0, client.ApiVersions.Count);
        }

        [Test]
        public void InputClient_ApiVersions_EmptyCollection()
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
                [],
                []);

            // Assert
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