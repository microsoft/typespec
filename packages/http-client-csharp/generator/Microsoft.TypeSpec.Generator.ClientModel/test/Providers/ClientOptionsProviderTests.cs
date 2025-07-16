// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class ClientOptionsProviderTests
    {
        private const string ApiVersionsCategory = "WithApiVersions";

        [SetUp]
        public void SetUp()
        {
            var categories = TestContext.CurrentContext.Test?.Properties["Category"];
            bool containsApiVersions = categories?.Contains(ApiVersionsCategory) ?? false;

            // Load the mock generator with or without api versions
            if (containsApiVersions)
            {
                List<string> apiVersions = ["1.0", "2.0"];
                var enumValues = apiVersions.Select(a => (a, a));
                var inputEnum = InputFactory.StringEnum("ServiceVersion", enumValues, usage: InputModelTypeUsage.ApiVersionEnum);

                MockHelpers.LoadMockGenerator(
                    apiVersions: () => apiVersions,
                    inputEnums: () => [inputEnum]);
            }
            else
            {
                MockHelpers.LoadMockGenerator();
            }
        }

        [Test]
        public void TestImplements()
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var clientOptionsProvider = new ClientOptionsProvider(client, clientProvider);

            Assert.IsNotNull(clientOptionsProvider);

            var implements = clientOptionsProvider.Implements;
            Assert.IsNotNull(implements);
            Assert.AreEqual(1, implements.Count);
            Assert.AreEqual(new CSharpType(typeof(ClientPipelineOptions)), implements[0]);
        }

        [TestCase(true, Category = ApiVersionsCategory)]
        [TestCase(false)]
        public void TestFields(bool containsApiVersions)
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var clientOptionsProvider = new ClientOptionsProvider(client, clientProvider);

            Assert.IsNotNull(clientOptionsProvider);
            var fields = clientOptionsProvider.Fields;

            if (containsApiVersions)
            {
                Assert.AreEqual(1, fields.Count);
                Assert.IsTrue("LatestVersion" == fields[0].Name);
                Assert.IsTrue(fields[0].Type == clientOptionsProvider.NestedTypes[0].Type);
            }
            else
            {
                Assert.AreEqual(0, fields.Count);
            }
        }

        [TestCase(true, Category = ApiVersionsCategory)]
        [TestCase(false)]
        public void TestNestedTypes(bool containsApiVersions)
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var clientOptionsProvider = new ClientOptionsProvider(client, clientProvider);

            Assert.IsNotNull(clientOptionsProvider);

            var nestedTypes = clientOptionsProvider.NestedTypes;
            if (containsApiVersions)
            {
                Assert.AreEqual(1, nestedTypes.Count);
                var nestedType = nestedTypes[0];
                Assert.IsTrue(nestedType.Name == "ServiceVersion");
                Assert.AreEqual(TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum, nestedType.DeclarationModifiers);
                var nestedTypeFields = nestedType.Fields;
                Assert.AreEqual(2, nestedTypeFields.Count);
                Assert.AreEqual("V1_0", nestedTypeFields[0].Name);
                Assert.AreEqual("V2_0", nestedTypeFields[1].Name);
            }
            else
            {
                Assert.AreEqual(0, nestedTypes.Count);
            }
        }

        [TestCase(true, Category = ApiVersionsCategory)]
        [TestCase(false)]
        public void TestConstructors(bool containsApiVersions)
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var clientOptionsProvider = new ClientOptionsProvider(client, clientProvider);

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

        [TestCase(true, Category = ApiVersionsCategory)]
        [TestCase(false)]
        public void TestProperties(bool containsApiVersions)
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var clientOptionsProvider = new ClientOptionsProvider(client, clientProvider);

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

        [Test]
        public async Task BackCompat_PrereleaseApiVersionsAdded()
        {
            List<string> apiVersions = ["1.0", "2.0"];
            var enumValues = apiVersions.Select(a => (a, a));
            var inputEnum = InputFactory.StringEnum(
                "ServiceVersion",
                enumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "SampleNamespace");

            await MockHelpers.LoadMockGeneratorAsync(
                apiVersions: () => apiVersions,
                inputEnums: () => [inputEnum],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var inputClient = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);
            var clientOptionsProvider = clientProvider!.ClientOptions;
            Assert.IsNotNull(clientOptionsProvider);

            // validate the latest version field
            var latestVersionField = clientOptionsProvider!.Fields.FirstOrDefault(f => f.Name == "LatestVersion");
            Assert.IsNotNull(latestVersionField);
            Assert.AreEqual(
                "global::SampleNamespace.TestClientOptions.ServiceVersion.V2_0",
                latestVersionField?.InitializationValue?.ToDisplayString());

            // validate the constructor
            var constructor = clientOptionsProvider.Constructors.FirstOrDefault();
            Assert.IsNotNull(constructor);

            var body = constructor?.BodyStatements?.ToDisplayString();
            Assert.IsTrue(body?.Contains("ServiceVersion.V1_0 => \"1.0\""));
            Assert.IsTrue(body?.Contains("ServiceVersion.V2_0 => \"2.0\""));
            Assert.IsTrue(body?.Contains("ServiceVersion.V2023_10_01_Beta => \"2023-10-01-beta\""));
            Assert.IsTrue(body?.Contains("ServiceVersion.V2023_11_01_Beta => \"2023-11-01-beta\""));
        }

        [Test]
        public async Task BackCompat_GAApiVersionsAdded()
        {
            string[] apiVersions = ["2.0.0", "3.0.0"];
            var enumValues = apiVersions.Select(a => (a, a));
            var inputEnum = InputFactory.StringEnum(
                "ServiceVersion",
                enumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "SampleNamespace");

            await MockHelpers.LoadMockGeneratorAsync(
                apiVersions: () => apiVersions,
                inputEnums: () => [inputEnum],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var inputClient = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);
            var clientOptionsProvider = clientProvider!.ClientOptions;
            Assert.IsNotNull(clientOptionsProvider);

            // validate the latest version field
            var latestVersionField = clientOptionsProvider!.Fields.FirstOrDefault(f => f.Name == "LatestVersion");
            Assert.IsNotNull(latestVersionField);
            Assert.AreEqual(
                "global::SampleNamespace.TestClientOptions.ServiceVersion.V3_0_0",
                latestVersionField?.InitializationValue?.ToDisplayString());

            // validate the constructor
            var constructor = clientOptionsProvider.Constructors.FirstOrDefault();
            Assert.IsNotNull(constructor);

            var body = constructor?.BodyStatements?.ToDisplayString();
            Assert.IsTrue(body?.Contains("ServiceVersion.V1_0_0 => \"1.0.0\""));
            Assert.IsTrue(body?.Contains("ServiceVersion.V2_0_0 => \"2.0.0\""));
            Assert.IsTrue(body?.Contains("ServiceVersion.V3_0_0 => \"3.0.0\""));
        }

        [Test]
        public void ServiceVersionEnumIsForcedToClientOptionsNamespace()
        {
            string[] apiVersions = ["2.0.0", "3.0.0"];
            var enumValues = apiVersions.Select(a => (a, a));
            var inputEnum = InputFactory.StringEnum(
                "ServiceVersion",
                enumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "SampleNamespace");
            var inputClient = InputFactory.Client("TestClient", clientNamespace: "SomeOtherNamespace");
            MockHelpers.LoadMockGenerator(
                inputEnums: () => [inputEnum],
                clients: () => [inputClient]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            Assert.IsNotNull(clientProvider);

            var clientOptionsProvider = clientProvider!.ClientOptions;
            Assert.IsNotNull(clientOptionsProvider);
            Assert.AreEqual("SomeOtherNamespace", clientOptionsProvider!.Type.Namespace);
            Assert.IsNotNull(clientOptionsProvider.NestedTypes);
            Assert.AreEqual(1, clientOptionsProvider.NestedTypes.Count);

            var serviceVersionType = clientOptionsProvider.NestedTypes[0];
            Assert.IsNotNull(serviceVersionType);
            Assert.AreEqual("ServiceVersion", serviceVersionType.Name);
            Assert.AreEqual("SomeOtherNamespace", serviceVersionType.Type.Namespace);
        }
    }
}
