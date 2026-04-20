// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class ClientOptionsProviderTests
    {
        private const string ApiVersionsCategory = "WithApiVersions";

        [SetUp]
        public void SetUp()
        {
            // Reset the singleton instance before each test using reflection
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance", BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);

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
            // IConfigurationSection constructor is always generated
            var configSectionCtor = ctors.FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor, "IConfigurationSection constructor should always be generated");

            if (containsApiVersions)
            {
                Assert.AreEqual(2, ctors.Count);
                var versionCtor = ctors.First(c => c.Signature.Parameters.Any(p => p.Name == "version"));
                var signature = versionCtor.Signature;
                Assert.AreEqual(1, signature.Parameters.Count);
                var versionParam = signature.Parameters[0];
                Assert.AreEqual("version", versionParam.Name);
                Assert.AreEqual(clientOptionsProvider.NestedTypes[0].Type, versionParam.Type);
                Assert.IsNotNull(versionParam.DefaultValue);
                Assert.IsNotNull(versionCtor.BodyStatements);
            }
            else
            {
                Assert.AreEqual(2, ctors.Count);
                var defaultCtor = ctors.First(c => !c.Signature.Parameters.Any());
                Assert.IsNotNull(defaultCtor, "Default parameterless constructor should be generated");
            }
        }

        [TestCase(true, Category = ApiVersionsCategory)]
        [TestCase(false)]
        public void TestConfigurationSectionConstructorBody(bool containsApiVersions)
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var clientOptionsProvider = new ClientOptionsProvider(client, clientProvider);

            var ctors = clientOptionsProvider.Constructors;
            var configSectionCtor = ctors.FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            // Validate it's internal
            Assert.AreEqual(MethodSignatureModifiers.Internal, configSectionCtor!.Signature.Modifiers);

            // Validate it has the base(section) initializer
            Assert.IsNotNull(configSectionCtor.Signature.Initializer);
            Assert.IsTrue(configSectionCtor.Signature.Initializer!.IsBase);

            // Validate the body is not empty
            var body = configSectionCtor.BodyStatements;
            Assert.IsNotNull(body);

            var bodyString = body!.ToDisplayString();

            // Always has a guard statement
            Assert.IsTrue(bodyString.Contains("section is null") || bodyString.Contains("Exists"),
                "Configuration section constructor should have a guard statement");

            if (containsApiVersions)
            {
                // When API versions exist, Version should be set to latest before guard
                Assert.IsTrue(bodyString.Contains("Version ="),
                    "Configuration constructor should set Version when API versions exist");
                // After guard, should read version from config
                Assert.IsTrue(bodyString.Contains("section[\"Version\"]"),
                    "Configuration constructor should read Version from config section");
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
        public void MultipleClientsWithRequiredCustomParametersShareSingletonOptions()
        {
            // Required parameters (no DefaultValue) should NOT trigger a separate client-specific options type.
            // They are inlined as constructor parameters on the client, not as properties on ClientOptions.
            var requiredParam = InputFactory.MethodParameter(
                "knowledgeBaseName",
                InputPrimitiveType.String,
                isRequired: true,
                scope: InputParameterScope.Client);

            var client1 = InputFactory.Client("KnowledgeBaseRetrievalClient", clientNamespace: "TestNamespace", parameters: [requiredParam]);
            var client2 = InputFactory.Client("SearchClient", clientNamespace: "TestNamespace");

            MockHelpers.LoadMockGenerator(clients: () => [client1, client2]);

            var clientProvider1 = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client1);
            var clientProvider2 = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client2);

            Assert.IsNotNull(clientProvider1);
            Assert.IsNotNull(clientProvider2);

            var options1 = clientProvider1!.ClientOptions;
            var options2 = clientProvider2!.ClientOptions;

            Assert.IsNotNull(options1);
            Assert.IsNotNull(options2);

            // Both clients should share the same singleton ClientOptions instance
            // because the required parameter does not become a property on the options class
            Assert.AreSame(options1, options2);

            // The name should be based on the InputNamespace (singleton naming)
            Assert.AreEqual("SampleClientOptions", options1!.Name);
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

        [Test]
        public void MultiServiceClient_GeneratesExpectedClientOptions()
        {
            // Setup multiservice client with multiple API version enums
            List<string> serviceAVersions = ["1.0", "2.0"];
            List<string> serviceBVersions = ["3.0", "4.0"];

            var serviceAEnumValues = serviceAVersions.Select(a => (a, a));
            var serviceBEnumValues = serviceBVersions.Select(a => (a, a));

            var serviceAEnum = InputFactory.StringEnum(
                "ServiceVersionA",
                serviceAEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.ServiceA");
            var serviceBEnum = InputFactory.StringEnum(
                "ServiceVersionB",
                serviceBEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.ServiceB");
            var client = InputFactory.Client("TestClient", isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. serviceAVersions, .. serviceBVersions],
                clients: () => [client],
                inputEnums: () => [serviceAEnum, serviceBEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider?.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var writer = new TypeProviderWriter(clientOptionsProvider!);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultiServiceClient_WithThreeServices_GeneratesExpectedClientOptions()
        {
            // Setup multiservice client with three different services (KeyVault, Storage, Compute)
            List<string> keyVaultVersions = ["7.4", "7.5"];
            List<string> storageVersions = ["2023-01-01", "2024-01-01"];
            List<string> computeVersions = ["2023-07-01", "2024-03-01", "2024-07-01"];

            var keyVaultEnumValues = keyVaultVersions.Select(a => (a, a));
            var storageEnumValues = storageVersions.Select(a => (a, a));
            var computeEnumValues = computeVersions.Select(a => (a, a));

            var keyVaultEnum = InputFactory.StringEnum(
                "KeyVaultVersion",
                keyVaultEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.KeyVault");
            var storageEnum = InputFactory.StringEnum(
                "StorageVersion",
                storageEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.Storage");
            var computeEnum = InputFactory.StringEnum(
                "ComputeVersion",
                computeEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.Compute");
            var client = InputFactory.Client("TestClient", isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. keyVaultVersions, .. storageVersions, .. computeVersions],
                clients: () => [client],
                inputEnums: () => [keyVaultEnum, storageEnum, computeEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider?.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var writer = new TypeProviderWriter(clientOptionsProvider!);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultiServiceCombinedClient_GeneratesExpectedClientOptions()
        {
            // Setup multiservice combined client with multiple API version enums and operations
            List<string> serviceAVersions = ["1.0", "2.0"];
            List<string> serviceBVersions = ["3.0", "4.0"];

            var serviceAEnumValues = serviceAVersions.Select(a => (a, a));
            var serviceBEnumValues = serviceBVersions.Select(a => (a, a));

            var serviceAEnum = InputFactory.StringEnum(
                "ServiceVersionA",
                serviceAEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.ServiceA");
            var serviceBEnum = InputFactory.StringEnum(
                "ServiceVersionB",
                serviceBEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.ServiceB");

            InputParameter apiVersionParameter = InputFactory.QueryParameter(
                "apiVersion",
                InputPrimitiveType.String,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: true);

            // Create operations with namespace set to each service
            var serviceAOperation = InputFactory.Operation(
                "ServiceAOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.ServiceA");

            var serviceBOperation = InputFactory.Operation(
                "ServiceBOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.ServiceB");

            var client = InputFactory.Client(
                "TestClient",
                methods:
                [
                    InputFactory.BasicServiceMethod("ServiceAMethod", serviceAOperation),
                    InputFactory.BasicServiceMethod("ServiceBMethod", serviceBOperation)
                ],
                parameters: [apiVersionParameter],
                isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. serviceAVersions, .. serviceBVersions],
                clients: () => [client],
                inputEnums: () => [serviceAEnum, serviceBEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider?.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var writer = new TypeProviderWriter(clientOptionsProvider!);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultiServiceCombinedClient_WithThreeServices_GeneratesExpectedClientOptions()
        {
            // Setup multiservice combined client with three different services (KeyVault, Storage, Compute)
            List<string> keyVaultVersions = ["7.4", "7.5"];
            List<string> storageVersions = ["2023-01-01", "2024-01-01"];
            List<string> computeVersions = ["2023-07-01", "2024-03-01", "2024-07-01"];

            var keyVaultEnumValues = keyVaultVersions.Select(a => (a, a));
            var storageEnumValues = storageVersions.Select(a => (a, a));
            var computeEnumValues = computeVersions.Select(a => (a, a));

            var keyVaultEnum = InputFactory.StringEnum(
                "KeyVaultVersion",
                keyVaultEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.KeyVault");
            var storageEnum = InputFactory.StringEnum(
                "StorageVersion",
                storageEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.Storage");
            var computeEnum = InputFactory.StringEnum(
                "ComputeVersion",
                computeEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.Compute");

            InputParameter apiVersionParameter = InputFactory.QueryParameter(
                "apiVersion",
                InputPrimitiveType.String,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: true);

            // Create operations with namespace set to each service
            var keyVaultOperation = InputFactory.Operation(
                "KeyVaultOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.KeyVault");

            var storageOperation = InputFactory.Operation(
                "StorageOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.Storage");

            var computeOperation = InputFactory.Operation(
                "ComputeOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.Compute");

            var client = InputFactory.Client(
                "TestClient",
                methods:
                [
                    InputFactory.BasicServiceMethod("KeyVaultMethod", keyVaultOperation),
                    InputFactory.BasicServiceMethod("StorageMethod", storageOperation),
                    InputFactory.BasicServiceMethod("ComputeMethod", computeOperation)
                ],
                parameters: [apiVersionParameter],
                isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. keyVaultVersions, .. storageVersions, .. computeVersions],
                clients: () => [client],
                inputEnums: () => [keyVaultEnum, storageEnum, computeEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider?.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var writer = new TypeProviderWriter(clientOptionsProvider!);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultiServiceClient_SameLastSegment_ProducesUniqueVersionEnums()
        {
            // Regression test: when two services have different full namespaces but the same last
            // segment, the generated service version enums should still have distinct names.
            List<string> serviceOneVersions = ["1.0", "2.0"];
            List<string> serviceTwoVersions = ["3.0", "4.0"];

            var serviceOneEnumValues = serviceOneVersions.Select(a => (a, a));
            var serviceTwoEnumValues = serviceTwoVersions.Select(a => (a, a));

            // Different full namespaces, same last segment ("Tests")
            var serviceOneEnum = InputFactory.StringEnum(
                "ServiceOneVersions",
                serviceOneEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Azure.ServiceOne.Tests");
            var serviceTwoEnum = InputFactory.StringEnum(
                "ServiceTwoVersions",
                serviceTwoEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Azure.ServiceTwo.Tests");

            var client = InputFactory.Client("TestClient", isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. serviceOneVersions, .. serviceTwoVersions],
                clients: () => [client],
                inputEnums: () => [serviceOneEnum, serviceTwoEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider?.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            // Validate nested service version enums have unique names
            var nestedTypes = clientOptionsProvider!.NestedTypes;
            Assert.AreEqual(2, nestedTypes.Count);
            CollectionAssert.AllItemsAreUnique(nestedTypes.Select(t => t.Name).ToList());

            var writer = new TypeProviderWriter(clientOptionsProvider!);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultiServiceClient_UniqueNamespaces_ProducesUniqueVersionEnums()
        {
            List<string> serviceOneVersions = ["2024-01-01"];
            List<string> serviceTwoVersions = ["2024-06-01"];

            var serviceOneEnumValues = serviceOneVersions.Select(a => (a, a));
            var serviceTwoEnumValues = serviceTwoVersions.Select(a => (a, a));

            var serviceOneEnum = InputFactory.StringEnum(
                "Versions",
                serviceOneEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "ServiceOne");
            var serviceTwoEnum = InputFactory.StringEnum(
                "Versions",
                serviceTwoEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "ServiceTwo");

            InputParameter apiVersionParameter = InputFactory.QueryParameter(
                "apiVersion",
                InputPrimitiveType.String,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: true);

            var serviceOneOperation = InputFactory.Operation(
                "ServiceOneOperation",
                parameters: [apiVersionParameter],
                ns: "ServiceOne");

            var serviceTwoOperation = InputFactory.Operation(
                "ServiceTwoOperation",
                parameters: [apiVersionParameter],
                ns: "ServiceTwo");

            var client = InputFactory.Client(
                "MultiServiceClient",
                methods:
                [
                    InputFactory.BasicServiceMethod("ServiceOneMethod", serviceOneOperation),
                    InputFactory.BasicServiceMethod("ServiceTwoMethod", serviceTwoOperation)
                ],
                parameters: [apiVersionParameter],
                isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. serviceOneVersions, .. serviceTwoVersions],
                clients: () => [client],
                inputEnums: () => [serviceOneEnum, serviceTwoEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            // Validate that Fields access does not crash (the original issue crashed here)
            Assert.DoesNotThrow(() => _ = clientProvider!.Fields);

            // Validate that Methods access does not crash (original crash site: Fields.ToDictionary in BuildMethods)
            Assert.DoesNotThrow(() => _ = clientProvider!.Methods);

            var clientOptionsProvider = clientProvider?.ClientOptions;
            Assert.IsNotNull(clientOptionsProvider);

            // Validate nested service version enums have unique names
            var nestedTypes = clientOptionsProvider!.NestedTypes;
            Assert.AreEqual(2, nestedTypes.Count);
            CollectionAssert.AllItemsAreUnique(nestedTypes.Select(t => t.Name).ToList());

            // Verify enum names follow the XServiceVersion pattern
            Assert.AreEqual("ServiceOneServiceVersion", nestedTypes[0].Name);
            Assert.AreEqual("ServiceTwoServiceVersion", nestedTypes[1].Name);

            var writer = new TypeProviderWriter(clientOptionsProvider!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultiServiceClient_SameNamespace_ProducesUniqueVersionEnums()
        {
            // Regression test for the scenario where both enums share the exact same namespace
            // (e.g., when tspconfig remaps both services to the same C# output namespace).
            List<string> serviceOneVersions = ["2024-01-01"];
            List<string> serviceTwoVersions = ["2024-06-01"];

            var serviceOneEnumValues = serviceOneVersions.Select(a => (a, a));
            var serviceTwoEnumValues = serviceTwoVersions.Select(a => (a, a));

            // Both enums have the EXACT SAME namespace (simulates tspconfig namespace override)
            var serviceOneEnum = InputFactory.StringEnum(
                "ServiceOneVersions",
                serviceOneEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Azure.Generator.MgmtTypeSpec.MultiService.Tests");
            var serviceTwoEnum = InputFactory.StringEnum(
                "ServiceTwoVersions",
                serviceTwoEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Azure.Generator.MgmtTypeSpec.MultiService.Tests");

            InputParameter apiVersionParameter = InputFactory.QueryParameter(
                "apiVersion",
                InputPrimitiveType.String,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: true);

            var serviceOneOperation = InputFactory.Operation(
                "ServiceOneOperation",
                parameters: [apiVersionParameter],
                ns: "Azure.Generator.MgmtTypeSpec.MultiService.Tests");

            var serviceTwoOperation = InputFactory.Operation(
                "ServiceTwoOperation",
                parameters: [apiVersionParameter],
                ns: "Azure.Generator.MgmtTypeSpec.MultiService.Tests");

            var client = InputFactory.Client(
                "MultiServiceClient",
                methods:
                [
                    InputFactory.BasicServiceMethod("ServiceOneMethod", serviceOneOperation),
                    InputFactory.BasicServiceMethod("ServiceTwoMethod", serviceTwoOperation)
                ],
                parameters: [apiVersionParameter],
                isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. serviceOneVersions, .. serviceTwoVersions],
                clients: () => [client],
                inputEnums: () => [serviceOneEnum, serviceTwoEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            Assert.DoesNotThrow(() => _ = clientProvider!.Fields);
            Assert.DoesNotThrow(() => _ = clientProvider!.Methods);

            var clientOptionsProvider = clientProvider?.ClientOptions;
            Assert.IsNotNull(clientOptionsProvider);

            // Validate nested service version enums have unique names
            var nestedTypes = clientOptionsProvider!.NestedTypes;
            Assert.AreEqual(2, nestedTypes.Count);
            CollectionAssert.AllItemsAreUnique(nestedTypes.Select(t => t.Name).ToList());

            var writer = new TypeProviderWriter(clientOptionsProvider!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestConfigurationSectionConstructorBody_WithBoolProperty()
        {
            var boolParam = InputFactory.MethodParameter(
                "enableRetry",
                InputPrimitiveType.Boolean,
                isRequired: false,
                defaultValue: new InputConstant(true, InputPrimitiveType.Boolean),
                scope: InputParameterScope.Client);

            var client = InputFactory.Client("TestClient", parameters: [boolParam]);

            MockHelpers.LoadMockGenerator(clients: () => [client]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider!.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var configSectionCtor = clientOptionsProvider!.Constructors
                .FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            var bodyString = configSectionCtor!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("bool.TryParse"),
                "IConfigurationSection constructor should use bool.TryParse for bool property binding");
            Assert.IsTrue(bodyString.Contains("EnableRetry"),
                "IConfigurationSection constructor should assign to EnableRetry property");
        }

        [Test]
        public void TestConfigurationSectionConstructorBody_WithIntProperty()
        {
            var intParam = InputFactory.MethodParameter(
                "maxRetries",
                InputPrimitiveType.Int32,
                isRequired: false,
                defaultValue: new InputConstant(3, InputPrimitiveType.Int32),
                scope: InputParameterScope.Client);

            var client = InputFactory.Client("TestClient", parameters: [intParam]);

            MockHelpers.LoadMockGenerator(clients: () => [client]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider!.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var configSectionCtor = clientOptionsProvider!.Constructors
                .FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            var bodyString = configSectionCtor!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("int.TryParse"),
                "IConfigurationSection constructor should use int.TryParse for int property binding");
            Assert.IsTrue(bodyString.Contains("MaxRetries"),
                "IConfigurationSection constructor should assign to MaxRetries property");
        }

        [Test]
        public void TestConfigurationSectionConstructorBody_WithEnumProperty()
        {
            var enumType = InputFactory.StringEnum(
                "AppAudience",
                [("Public", "public"), ("Private", "private")],
                isExtensible: true);

            var enumParam = InputFactory.MethodParameter(
                "audience",
                enumType,
                isRequired: false,
                defaultValue: new InputConstant("public", enumType),
                scope: InputParameterScope.Client);

            var client = InputFactory.Client("TestClient", parameters: [enumParam]);

            MockHelpers.LoadMockGenerator(
                clients: () => [client],
                inputEnums: () => [enumType]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider!.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var configSectionCtor = clientOptionsProvider!.Constructors
                .FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            var bodyString = configSectionCtor!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("is string"),
                "IConfigurationSection constructor should use 'is string' pattern for extensible enum property binding");
            Assert.IsTrue(bodyString.Contains("new"),
                "IConfigurationSection constructor should create new enum instance");
            Assert.IsTrue(bodyString.Contains("Audience"),
                "IConfigurationSection constructor should assign to Audience property");
        }

        [Test]
        public void TestConfigurationSectionConstructorBody_WithStringProperty()
        {
            var stringParam = InputFactory.MethodParameter(
                "tenantId",
                InputPrimitiveType.String,
                isRequired: false,
                defaultValue: InputFactory.Constant.String("default"),
                scope: InputParameterScope.Client);

            var client = InputFactory.Client("TestClient", parameters: [stringParam]);

            MockHelpers.LoadMockGenerator(clients: () => [client]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider!.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var configSectionCtor = clientOptionsProvider!.Constructors
                .FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            var bodyString = configSectionCtor!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("IsNullOrEmpty"),
                "IConfigurationSection constructor should use string.IsNullOrEmpty for string property binding");
            Assert.IsTrue(bodyString.Contains("TenantId"),
                "IConfigurationSection constructor should assign to TenantId property");
        }

        [Test]
        public void TestConfigurationSectionConstructorBody_WithComplexObjectProperty()
        {
            var complexModel = InputFactory.Model(
                "CustomOptions",
                properties: new[]
                {
                    InputFactory.Property("setting1", InputPrimitiveType.String, isRequired: true, wireName: "setting1"),
                    InputFactory.Property("setting2", InputPrimitiveType.Int32, isRequired: false, wireName: "setting2")
                });

            var complexParam = InputFactory.MethodParameter(
                "customOptions",
                complexModel,
                isRequired: false,
                defaultValue: new InputConstant(null, complexModel),
                scope: InputParameterScope.Client);

            var client = InputFactory.Client("TestClient", parameters: [complexParam]);

            MockHelpers.LoadMockGenerator(
                clients: () => [client],
                inputModels: () => [complexModel]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider!.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var configSectionCtor = clientOptionsProvider!.Constructors
                .FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            var bodyString = configSectionCtor!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("GetSection"),
                "IConfigurationSection constructor should use GetSection for complex object property binding");
            Assert.IsTrue(bodyString.Contains("Exists"),
                "IConfigurationSection constructor should check Exists for complex object property binding");
            Assert.IsTrue(bodyString.Contains("CustomOptions") && bodyString.Contains("new"),
                "IConfigurationSection constructor should create new CustomOptions instance for complex object property binding");
        }

        [Test]
        public void TestConfigurationSectionConstructorBody_WithFixedEnumProperty()
        {
            var enumType = InputFactory.StringEnum(
                "ClientMode",
                [("Default", "default"), ("MultiClient", "multi-client")],
                isExtensible: false);

            var enumParam = InputFactory.MethodParameter(
                "mode",
                enumType,
                isRequired: false,
                defaultValue: new InputConstant("default", enumType),
                scope: InputParameterScope.Client);

            var client = InputFactory.Client("TestClient", parameters: [enumParam]);

            MockHelpers.LoadMockGenerator(
                clients: () => [client],
                inputEnums: () => [enumType]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider!.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);

            var configSectionCtor = clientOptionsProvider!.Constructors
                .FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            var bodyString = configSectionCtor!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("Enum.TryParse"),
                "IConfigurationSection constructor should use Enum.TryParse for fixed enum property binding");
            Assert.IsTrue(bodyString.Contains("Mode"),
                "IConfigurationSection constructor should assign to Mode property");
            Assert.IsFalse(bodyString.Contains("new ClientMode"),
                "IConfigurationSection constructor should NOT use new for fixed enum property binding");
        }

        [Test]
        public async Task TestConfigurationSectionConstructorBody_BindsCustomCodeProperties()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            var clientOptionsProvider = clientProvider!.ClientOptions;

            Assert.IsNotNull(clientOptionsProvider);
            Assert.IsNotNull(clientOptionsProvider!.CustomCodeView,
                "CustomCodeView should be available from the compilation");

            var configSectionCtor = clientOptionsProvider.Constructors
                .FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "section"));
            Assert.IsNotNull(configSectionCtor);

            var bodyString = configSectionCtor!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("Audience"),
                "IConfigurationSection constructor should bind the custom code 'Audience' property from configuration");
        }
    }
}
