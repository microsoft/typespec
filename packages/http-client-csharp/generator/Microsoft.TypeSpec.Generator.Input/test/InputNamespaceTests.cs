// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using System.Text.Json;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputNamespaceTests
    {
        [Test]
        public void CalculatesAllClients()
        {
            var rootClient = InputFactory.Client("Client1", "TestNamespace.Client1", "TestNamespace.Client1");
            var childClient = InputFactory.Client("Client2", "TestNamespace.Client2", "TestNamespace.Client2", parent: rootClient);
            var inputNamespace = InputFactory.Namespace("TestNamespace", [], [], clients: [rootClient]);

            Assert.AreEqual(2, inputNamespace.Clients.Count);
            Assert.AreEqual("Client1", inputNamespace.Clients[0].Name);
            Assert.AreEqual("Client2", inputNamespace.Clients[1].Name);

            Assert.AreEqual(1, inputNamespace.RootClients.Count);
            Assert.AreEqual("Client1", inputNamespace.RootClients[0].Name);
        }

        [Test]
        public void DeserializeThrowsDescriptiveErrorWhenNameMissing()
        {
            // A code model whose root object has no "name" property (e.g. an incomplete or
            // truncated payload) must fail with an actionable message naming the missing field,
            // not a bare "could not be converted to InputNamespace".
            var json = "{\n  \"$id\": \"1\",\n  \"apiVersions\": []\n}";

            var ex = Assert.Throws<JsonException>(() => TypeSpecSerialization.Deserialize(json));

            Assert.That(ex!.Message, Does.Contain("name"));
        }
    }
}
