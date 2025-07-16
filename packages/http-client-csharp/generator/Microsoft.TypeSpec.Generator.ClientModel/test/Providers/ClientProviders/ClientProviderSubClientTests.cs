// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderSubClientTests
    {
        private static readonly InputClient _testClient = InputFactory.Client("TestClient");
        private static readonly InputClient _animalClient = InputFactory.Client("animal", doc: "AnimalClient description", parent: _testClient);
        private static readonly InputClient _dogClient = InputFactory.Client("dog", doc: "DogClient description", parent: _animalClient);
        private static readonly InputClient _catClient = InputFactory.Client("cat", doc: "CatClient description", parent: _animalClient);
        private static readonly InputClient _hawkClient = InputFactory.Client("hawkClient", doc: "HawkClient description", parent: _animalClient);
        private static readonly InputClient _huskyClient = InputFactory.Client("husky", doc: "HuskyClient description", parent: _dogClient);

        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator(
                    auth: () => new(new InputApiKeyAuth("mock", null), null),
                    clients: () => [_testClient]);
        }

        // This test validates that the generated code is correct when the client has one direct subclient.
        [Test]
        public void ServiceClientWithSubClient()
        {
            string[] expectedSubClientFactoryMethodNames = [$"Get{_animalClient.Name.ToIdentifierName()}Client"];
            var clientProvider = new MockClientProvider(_testClient, expectedSubClientFactoryMethodNames);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // This test validates that the generated code is correct when a sub-client has a single sub-client.
        [Test]
        public void SubClientWithSingleSubClient()
        {
            string[] expectedSubClientFactoryMethodNames = [$"Get{_huskyClient.Name.ToIdentifierName()}Client"];
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
                $"Get{_dogClient.Name.ToIdentifierName()}Client",
                $"Get{_catClient.Name.ToIdentifierName()}Client",
                $"Get{_hawkClient.Name.ToIdentifierName()}"
            ];
            var clientProvider = new MockClientProvider(_animalClient, expectedSubClientFactoryMethodNames);
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void SubClientSummaryIsPopulatedWithDefaultDocs()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                clients: () => [new InputClient("test", @namespace: "test", string.Empty, null, null, [], [], InputFactory.Client("parentClient"), null)]);

            var client = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ClientProvider>().SingleOrDefault();
            Assert.IsNotNull(client);

            Assert.AreEqual("/// <summary> The Test sub-client. </summary>\n", client!.XmlDocs.Summary!.ToDisplayString());
        }

        private class MockClientProvider : ClientProvider
        {
            private readonly string[] _expectedSubClientFactoryMethodNames;
            public MockClientProvider(InputClient inputClient, string[] expectedSubClientFactoryMethodNames)
                : base(inputClient)
            {
                _expectedSubClientFactoryMethodNames = expectedSubClientFactoryMethodNames;
            }

            protected override ScmMethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods().Where(m => _expectedSubClientFactoryMethodNames.Contains(m.Signature?.Name))];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
            protected override PropertyProvider[] BuildProperties() => [];
        }
    }
}
