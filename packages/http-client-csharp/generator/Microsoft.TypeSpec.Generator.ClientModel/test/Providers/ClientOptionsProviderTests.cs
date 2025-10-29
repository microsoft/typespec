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
            // Reset the singleton instance before each test
            ClientOptionsProvider.ResetSingleton();

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
            Assert.AreEqual(0, implements.Count);
        }

        [Test]
        public void TestBaseType()
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var clientOptionsProvider = new ClientOptionsProvider(client, clientProvider);

            Assert.IsNotNull(clientOptionsProvider);

            var baseType = clientOptionsProvider.BaseType;
            Assert.IsNotNull(baseType);
            Assert.AreEqual(new CSharpType(typeof(ClientPipelineOptions)), baseType);

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

        [Test]
        public async Task CustomEnumMembersGenerateSwitchCorrectly()
        {
            string[] apiVersions = ["2023-10-01-preview-1", "2023-11-01", "2024-01-01"];
            var enumValues = apiVersions.Select((a, index) => (a, a));
            var inputEnum = InputFactory.StringEnum(
                "ServiceVersion",
                enumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "SampleNamespace");

            await MockHelpers.LoadMockGeneratorAsync(
                apiVersions: () => apiVersions,
                inputEnums: () => [inputEnum],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var inputClient = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);
            var clientOptionsProvider = clientProvider!.ClientOptions;
            Assert.IsNotNull(clientOptionsProvider);

            // validate the latest version field uses the last custom enum member
            var latestVersionField = clientOptionsProvider!.Fields.FirstOrDefault(f => f.Name == "LatestVersion");
            Assert.IsNotNull(latestVersionField);
            Assert.AreEqual(
                "global::SampleNamespace.TestClientOptions.ServiceVersion.V2024_01_01",
                latestVersionField?.InitializationValue?.ToDisplayString());

            // validate the constructor has the switch statement with custom enum members
            var constructor = clientOptionsProvider.Constructors.FirstOrDefault();
            Assert.IsNotNull(constructor);

            var body = constructor?.BodyStatements?.ToDisplayString();
            Assert.IsNotNull(body);
            
            // Verify the switch statement contains custom enum members with their correct string values
            Assert.IsTrue(body?.Contains("ServiceVersion.V2023_10_01_Preview_1 => \"2023-10-01-preview-1\""));
            Assert.IsTrue(body?.Contains("ServiceVersion.V2023_11_01 => \"2023-11-01\""));
            Assert.IsTrue(body?.Contains("ServiceVersion.V2024_01_01 => \"2024-01-01\""));
        }

        [Test]
        public void SingletonCreatedForMultipleClientsWithStandardParameters()
        {
            var client1 = InputFactory.Client("ClientA", clientNamespace: "TestNamespace");
            var client2 = InputFactory.Client("ClientB", clientNamespace: "TestNamespace");

            MockHelpers.LoadMockGenerator(clients: () => [client1, client2]);

            var clientProvider1 = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client1);
            var clientProvider2 = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client2);

            Assert.IsNotNull(clientProvider1);
            Assert.IsNotNull(clientProvider2);

            var options1 = clientProvider1!.ClientOptions;
            var options2 = clientProvider2!.ClientOptions;

            Assert.IsNotNull(options1);
            Assert.IsNotNull(options2);

            // Both clients should share the same ClientOptions instance
            Assert.AreSame(options1, options2);

            // The name should be based on the InputNamespace's last segment (which is "Sample" in MockHelpers)
            Assert.AreEqual("SampleClientOptions", options1!.Name);
        }

        [Test]
        public void SingleClientCreatesClientSpecificOptions()
        {
            var client = InputFactory.Client("TestClient", clientNamespace: "TestNamespace");
            
            MockHelpers.LoadMockGenerator(clients: () => [client]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);

            Assert.IsNotNull(clientProvider);
            
            var options = clientProvider!.ClientOptions;

            Assert.IsNotNull(options);
            
            // The name should be based on the client name
            Assert.AreEqual("TestClientOptions", options!.Name);
        }

        [Test]
        public void MultipleClientsWithCustomParametersCreateSeparateOptions()
        {
            var customParam = InputFactory.MethodParameter(
                "customParam",
                InputPrimitiveType.String,
                isRequired: false,
                defaultValue: InputFactory.Constant.String("default"),
                scope: InputParameterScope.Client);

            var client1 = InputFactory.Client("ClientA", clientNamespace: "TestNamespace", parameters: [customParam]);
            var client2 = InputFactory.Client("ClientB", clientNamespace: "TestNamespace");

            MockHelpers.LoadMockGenerator(clients: () => [client1, client2]);

            var clientProvider1 = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client1);
            var clientProvider2 = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client2);

            Assert.IsNotNull(clientProvider1);
            Assert.IsNotNull(clientProvider2);

            var options1 = clientProvider1!.ClientOptions;
            var options2 = clientProvider2!.ClientOptions;

            Assert.IsNotNull(options1);
            Assert.IsNotNull(options2);

            // ClientA has custom parameters, so it should NOT share options
            Assert.AreNotSame(options1, options2);

            // ClientA should have client-specific options
            Assert.AreEqual("ClientAOptions", options1!.Name);
            // ClientB should have namespace-based options (since it has only standard parameters)
            // Note: InputNamespace in MockHelpers is set to "Sample" by default
            Assert.AreEqual("SampleClientOptions", options2!.Name);
        }

        [Test]
        public void NamespaceLastSegmentIsUsedForSingletonName()
        {
            var client1 = InputFactory.Client("ClientA", clientNamespace: "Company.Service.Api");
            var client2 = InputFactory.Client("ClientB", clientNamespace: "Company.Service.Api");

            MockHelpers.LoadMockGenerator(clients: () => [client1, client2]);

            var clientProvider1 = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client1);

            Assert.IsNotNull(clientProvider1);

            var options = clientProvider1!.ClientOptions;

            Assert.IsNotNull(options);

            // The name should be based on the InputNamespace's last segment
            // Note: InputNamespace in MockHelpers is set to "Sample" by default, not based on client namespace
            Assert.AreEqual("SampleClientOptions", options!.Name);
        }
    }
}
