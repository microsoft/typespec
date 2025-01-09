// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderSubClientTests
    {
        private const string TestClientName = "TestClient";
        private static readonly InputOperation _inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.Parameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
        private static readonly InputClient _animalClient = new("animal", string.Empty, "AnimalClient description", [_inputOperation], [], TestClientName);
        private static readonly InputClient _dogClient = new("dog", string.Empty, "DogClient description", [_inputOperation], [], _animalClient.Name);
        private static readonly InputClient _catClient = new("cat", string.Empty, "CatClient description", [_inputOperation], [], _animalClient.Name);
        private static readonly InputClient _hawkClient = new("hawkClient", string.Empty, "HawkClient description", [_inputOperation], [], _animalClient.Name);
        private static readonly InputClient _huskyClient = new("husky", string.Empty, "HuskyClient description", [_inputOperation], [], _dogClient.Name);

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
            string[] expectedSubClientFactoryMethodNames = [$"Get{StringHelpers.ToCleanName(_animalClient.Name)}Client"];
            var clientProvider = new MockClientProvider(client, expectedSubClientFactoryMethodNames);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // This test validates that the generated code is correct when a sub-client has a single sub-client.
        [Test]
        public void SubClientWithSingleSubClient()
        {
            string[] expectedSubClientFactoryMethodNames = [$"Get{StringHelpers.ToCleanName(_huskyClient.Name)}Client"];
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
                $"Get{StringHelpers.ToCleanName(_dogClient.Name)}Client",
                $"Get{StringHelpers.ToCleanName(_catClient.Name)}Client",
                $"Get{StringHelpers.ToCleanName(_hawkClient.Name)}"
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
