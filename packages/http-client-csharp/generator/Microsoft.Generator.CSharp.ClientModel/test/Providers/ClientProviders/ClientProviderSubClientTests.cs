// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderSubClientTests
    {
        private const string TestClientName = "TestClient";
        private static readonly InputClient _animalClient = new("animal", "AnimalClient description", [], [], TestClientName);
        private static readonly InputClient _dogClient = new("dog", "DogClient description", [], [], _animalClient.Name);
        private static readonly InputClient _catClient = new("cat", "CatClient description", [], [], _animalClient.Name);
        private static readonly InputClient _huskyClient = new("husky", "HuskyClient description", [], [], _dogClient.Name);

        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin(
                    apiKeyAuth: () => new InputApiKeyAuth("mock", null),
                    clients: () => [_animalClient, _dogClient, _catClient, _huskyClient]);
        }

        // This test validates that the generated code is correct when the client has one direct subclient.
        [Test]
        public void ServiceClientWithSubClient()
        {
            var client = new InputClient(TestClientName, "TestClient description", [], [], null);
            var clientProvider = new ClientProvider(client);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // This test validates that the generated code is correct when a sub-client has a single sub-client.
        [Test]
        public void SubClientWithSingleSubClient()
        {
            var clientProvider = new ClientProvider(_dogClient);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // This test validates that the generated code is correct when a sub-client has multiple sub-clients.
        [Test]
        public void SubClientWithMultipleSubClients()
        {
            var clientProvider = new ClientProvider(_animalClient);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
