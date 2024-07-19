// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    public class ClientOptionsProviderTests
    {
        private readonly Mock<InputLibrary> _mockInputLibrary = new(MockHelpers.ConfigFilePath);

        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void TestImplements()
        {
            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));

            Assert.IsNotNull(clientOptionsProvider);

            var implements = clientOptionsProvider.Implements;
            Assert.IsNotNull(implements);
            Assert.AreEqual(1, implements.Count);
            Assert.AreEqual(new CSharpType(typeof(ClientPipelineOptions)), implements[0]);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestFields(bool containsApiVersions)
        {
            if (containsApiVersions)
            {
                List<string> apiVersions = ["1.0", "2.0"];
                var mockInputNs = new Mock<InputNamespace>("ns", apiVersions, Array.Empty<InputEnumType>(), Array.Empty<InputModelType>(), Array.Empty<InputClient>(), new InputAuth());
                var inputNsInstance = typeof(InputLibrary).GetField("_inputNamespace", BindingFlags.Instance | BindingFlags.NonPublic);
                inputNsInstance!.SetValue(_mockInputLibrary.Object, mockInputNs.Object);
                MockHelpers.LoadMockPlugin(inputLibrary: _mockInputLibrary.Object);
            }

            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));

            Assert.IsNotNull(clientOptionsProvider);
            var fields = clientOptionsProvider.Fields;

            if (containsApiVersions)
            {
                Assert.AreEqual(1, fields.Count);
                Assert.IsTrue("LatestVersion" == fields[0].Name);
            }
            else
            {
                Assert.AreEqual(0, fields.Count);
            }
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestNestedTypes(bool containsApiVersions)
        {
            if (containsApiVersions)
            {
                List<string> apiVersions = ["1.0", "2.0"];
                var mockInputNs = new Mock<InputNamespace>("ns", apiVersions, Array.Empty<InputEnumType>(), Array.Empty<InputModelType>(), Array.Empty<InputClient>(), new InputAuth());
                var inputNsInstance = typeof(InputLibrary).GetField("_inputNamespace", BindingFlags.Instance | BindingFlags.NonPublic);
                inputNsInstance!.SetValue(_mockInputLibrary.Object, mockInputNs.Object);
                MockHelpers.LoadMockPlugin(inputLibrary: _mockInputLibrary.Object);
            }

            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));

            Assert.IsNotNull(clientOptionsProvider);

            var nestedTypes = clientOptionsProvider.NestedTypes;
            if (containsApiVersions)
            {
                Assert.AreEqual(1, nestedTypes.Count);
                Assert.IsTrue(nestedTypes[0] is ServiceVersionDefinition);
            }
            else
            {
                Assert.AreEqual(0, nestedTypes.Count);
            }
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestConstructors(bool containsApiVersions)
        {
            if (containsApiVersions)
            {
                List<string> apiVersions = ["1.0", "2.0"];
                var mockInputNs = new Mock<InputNamespace>("ns", apiVersions, Array.Empty<InputEnumType>(), Array.Empty<InputModelType>(), Array.Empty<InputClient>(), new InputAuth());
                var inputNsInstance = typeof(InputLibrary).GetField("_inputNamespace", BindingFlags.Instance | BindingFlags.NonPublic);
                inputNsInstance!.SetValue(_mockInputLibrary.Object, mockInputNs.Object);
                MockHelpers.LoadMockPlugin(inputLibrary: _mockInputLibrary.Object);
            }

            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));

            Assert.IsNotNull(clientOptionsProvider);

            var ctors = clientOptionsProvider.Constructors;
            if (containsApiVersions)
            {
                Assert.AreEqual(1, ctors.Count);
                var ctor = ctors[0];
                var signature = ctor.Signature;
                Assert.AreEqual(1, signature.Parameters.Count);
                var versionParam = signature.Parameters[0];
                Assert.AreEqual("version", versionParam.Name);
                Assert.AreEqual(clientOptionsProvider.NestedTypes[0].Type, versionParam.Type);
                Assert.IsNotNull(versionParam.DefaultValue);
                Assert.IsNotNull(ctor.BodyStatements);
            }
            else
            {
                Assert.AreEqual(0, ctors.Count);
            }
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestProperties(bool containsApiVersions)
        {
            if (containsApiVersions)
            {
                List<string> apiVersions = ["1.0", "2.0"];
                var mockInputNs = new Mock<InputNamespace>("ns", apiVersions, Array.Empty<InputEnumType>(), Array.Empty<InputModelType>(), Array.Empty<InputClient>(), new InputAuth());
                var inputNsInstance = typeof(InputLibrary).GetField("_inputNamespace", BindingFlags.Instance | BindingFlags.NonPublic);
                inputNsInstance!.SetValue(_mockInputLibrary.Object, mockInputNs.Object);
                MockHelpers.LoadMockPlugin(inputLibrary: _mockInputLibrary.Object);
            }

            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));

            Assert.IsNotNull(clientOptionsProvider);

            var properties = clientOptionsProvider.Properties;
            if (containsApiVersions)
            {
                Assert.AreEqual(1, properties.Count);
                var property = properties[0];
                Assert.AreEqual("Version", property.Name);
                Assert.AreEqual(new CSharpType(typeof(string)), property.Type);
                Assert.AreEqual(MethodSignatureModifiers.Internal, property.Modifiers);
                var body = property.Body;
                Assert.IsNotNull(body);
                var autoPropertyBody = body as AutoPropertyBody;
                Assert.IsNotNull(autoPropertyBody);
                Assert.IsFalse(autoPropertyBody?.HasSetter);
            }
            else
            {
                Assert.AreEqual(0, properties.Count);
            }
        }

        [TestCase("1.0.0", "V1_0_0")]
        [TestCase("v1.0.0", "V1_0_0")]
        [TestCase("V1.0.0", "V1_0_0")]
        [TestCase("V2022.05.15_Preview", "V2022_05_15_Preview")]
        [TestCase("v2022.05.15_Preview", "V2022_05_15_Preview")]
        [TestCase("V2022.05.15-preview", "V2022_05_15_Preview")]
        public void TestParseApiVersion(string apiVersion, string expectedApiVersion)
        {
            // setup
            List<string> apiVersions = [apiVersion];
            var mockInputNs = new Mock<InputNamespace>("ns", apiVersions, Array.Empty<InputEnumType>(), Array.Empty<InputModelType>(), Array.Empty<InputClient>(), new InputAuth());
            var inputNsInstance = typeof(InputLibrary).GetField("_inputNamespace", BindingFlags.Instance | BindingFlags.NonPublic);
            inputNsInstance!.SetValue(_mockInputLibrary.Object, mockInputNs.Object);
            MockHelpers.LoadMockPlugin(inputLibrary: _mockInputLibrary.Object);
            var client = new InputClient("TestClient", "TestClient description", [], [], null);
            var clientOptionsProvider = new ClientOptionsProvider(client, new ClientProvider(client));

            Assert.IsNotNull(clientOptionsProvider);

            var parsedApiVersions = clientOptionsProvider.ApiVersions;
            Assert.IsNotNull(parsedApiVersions);
            Assert.AreEqual(1, parsedApiVersions.Count);
            Assert.AreEqual(expectedApiVersion, parsedApiVersions[0].Name);
        }
    }
}
