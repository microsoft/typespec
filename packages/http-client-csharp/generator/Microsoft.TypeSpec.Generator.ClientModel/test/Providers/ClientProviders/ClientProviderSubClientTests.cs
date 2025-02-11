// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderSubClientTests
    {
        private const string TestClientName = "TestClient";
        private static readonly InputClient _animalClient = InputFactory.Client("animal", doc: "AnimalClient description", parent: TestClientName);
        private static readonly InputClient _dogClient = InputFactory.Client("dog", doc: "DogClient description", parent: _animalClient.Name);
        private static readonly InputClient _catClient = InputFactory.Client("cat", doc: "CatClient description", parent: _animalClient.Name);
        private static readonly InputClient _hawkClient = InputFactory.Client("hawkClient", doc: "HawkClient description", parent: _animalClient.Name);
        private static readonly InputClient _huskyClient = InputFactory.Client("husky", doc: "HuskyClient description", parent: _dogClient.Name);

        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin(
                    apiKeyAuth: () => new InputApiKeyAuth("mock", null),
                    clients: () => [_animalClient, _dogClient, _catClient, _huskyClient, _hawkClient]);
        }

        // This test validates that the generated code is correct when the client has one direct subclient.
        [Test]
        public void ServiceClientWithSubClient()
        {
            var client = InputFactory.Client(TestClientName);
            string[] expectedSubClientFactoryMethodNames = [$"Get{_animalClient.Name.ToCleanName()}Client"];
            var clientProvider = new MockClientProvider(client, expectedSubClientFactoryMethodNames);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // This test validates that the generated code is correct when a sub-client has a single sub-client.
        [Test]
        public void SubClientWithSingleSubClient()
        {
            string[] expectedSubClientFactoryMethodNames = [$"Get{_huskyClient.Name.ToCleanName()}Client"];
            var clientProvider = new MockClientProvider(_dogClient, expectedSubClientFactoryMethodNames);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // This test validates that the generated code is correct when a sub-client has multiple sub-clients.
        [Test]
        public void SubClientWithMultipleSubClients()
        {
            string[] expectedSubClientFactoryMethodNames =
            [
                $"Get{_dogClient.Name.ToCleanName()}Client",
                $"Get{_catClient.Name.ToCleanName()}Client",
                $"Get{_hawkClient.Name.ToCleanName()}"
            ];
            var clientProvider = new MockClientProvider(_animalClient, expectedSubClientFactoryMethodNames);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private class MockClientProvider : ClientProvider
        {
            private readonly string[] _expectedSubClientFactoryMethodNames;
            public MockClientProvider(InputClient inputClient, string[] expectedSubClientFactoryMethodNames)
                : base(inputClient)
            {
                _expectedSubClientFactoryMethodNames = expectedSubClientFactoryMethodNames;
            }

            protected override MethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods().Where(m => _expectedSubClientFactoryMethodNames.Contains(m.Signature?.Name))];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
            protected override PropertyProvider[] BuildProperties() => [];
        }
    }
}
