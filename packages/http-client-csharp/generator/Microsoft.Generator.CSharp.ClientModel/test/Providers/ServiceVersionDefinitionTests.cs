// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    public class ServiceVersionDefinitionTests
    {

        [SetUp]
        public void SetUp()
        {
            List<string> apiVersions = ["1.0", "2.0"];
            var mockInputNs = new Mock<InputNamespace>("ns", apiVersions, Array.Empty<InputEnumType>(), Array.Empty<InputModelType>(), Array.Empty<InputClient>(), new InputAuth());
            var inputNsInstance = typeof(InputLibrary).GetField("_inputNamespace", BindingFlags.Instance | BindingFlags.NonPublic);
            Mock<InputLibrary> mockInputLibrary = new(MockHelpers.ConfigFilePath);
            inputNsInstance!.SetValue(mockInputLibrary.Object, mockInputNs.Object);
            MockHelpers.LoadMockPlugin(inputLibrary: mockInputLibrary.Object);
        }

        [Test]
        public void TestDeclarationModifiers()
        {
            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));
            var serviceVersionDefinition = new ServiceVersionDefinition(clientOptionsProvider);

            Assert.IsNotNull(serviceVersionDefinition);
            Assert.AreEqual(TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum, serviceVersionDefinition.DeclarationModifiers);
        }

        [Test]
        public void TestFields()
        {
            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));
            var serviceVersionDefinition = new ServiceVersionDefinition(clientOptionsProvider);

            Assert.IsNotNull(serviceVersionDefinition);
            var fields = serviceVersionDefinition.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("V1_0", fields[0].Name);
            Assert.AreEqual("V1_0", fields[0].Name);
        }

        [Test]
        public void TestLatestServiceVersion()
        {
            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));
            var serviceVersionDefinition = new ServiceVersionDefinition(clientOptionsProvider);

            Assert.IsNotNull(serviceVersionDefinition);
            Assert.AreEqual("V2_0", serviceVersionDefinition.LatestServiceVersion.Name);
        }
    }
}
