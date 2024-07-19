// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    public class ClientProviderTests
    {
        [OneTimeSetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void TestBuildProperties()
        {
            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            // validate the properties
            var properties = clientProvider.Properties;
            Assert.IsTrue(properties.Count > 0);
            // there should be a pipeline property
            Assert.AreEqual(1, properties.Count);

            var pipelineProperty = properties.First();
            Assert.AreEqual(typeof(ClientPipeline), pipelineProperty.Type.FrameworkType);
            Assert.AreEqual("Pipeline", pipelineProperty.Name);
            Assert.AreEqual(MethodSignatureModifiers.Public, pipelineProperty.Modifiers);
        }
    }
}
