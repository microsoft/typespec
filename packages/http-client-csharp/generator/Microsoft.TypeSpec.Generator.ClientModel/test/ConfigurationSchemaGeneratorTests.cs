// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    public class ConfigurationSchemaGeneratorTests
    {
        [SetUp]
        public void SetUp()
        {
            // Reset the singleton instance before each test
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance", BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);

            MockHelpers.LoadMockGenerator();
        }

        private static string GetExpectedJsonFromFile([CallerMemberName] string method = "", [CallerFilePath] string filePath = "")
        {
            var callingClass = Path.GetFileName(filePath).Split('.').First();
            var path = Path.Combine(Path.GetDirectoryName(filePath)!, "TestData", callingClass, $"{method}.json");
            return File.ReadAllText(path);
        }

        [Test]
        public void Generate_ReturnsNull_WhenNoClientsWithSettings()
        {
            var output = new TestOutputLibrary([]);
            var result = ConfigurationSchemaGenerator.Generate(output);
            Assert.IsNull(result);
        }

        [Test]
        public void Generate_ReturnsSchema_ForClientWithSettings()
        {
            var client = InputFactory.Client("TestService");
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider.ClientSettings, "ClientSettings should not be null for individually-initialized client");

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);

            var doc = JsonNode.Parse(result!)!;
            Assert.AreEqual("object", doc["type"]?.GetValue<string>());

            // Since the default generator uses SCM (System.ClientModel), the section should be "Clients"
            var clients = doc["properties"]?["Clients"];
            Assert.IsNotNull(clients, "Schema should have a 'Clients' section for SCM clients");
            Assert.AreEqual("object", clients!["type"]?.GetValue<string>());

            var testClient = clients["properties"]?["TestService"];
            Assert.IsNotNull(testClient, "Schema should have a well-known 'TestService' entry");
            Assert.AreEqual("object", testClient!["type"]?.GetValue<string>());

            var expected = GetExpectedJsonFromFile();
            Assert.AreEqual(expected, result);
        }

        [Test]
        public void Generate_IncludesCredentialReference()
        {
            var client = InputFactory.Client("TestService");
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var credential = clientEntry?["properties"]?["Credential"];
            Assert.IsNotNull(credential, "Client entry should have a Credential property");
            Assert.AreEqual("#/definitions/credential", credential!["$ref"]?.GetValue<string>());
        }

        [Test]
        public void Generate_IncludesOptionsReference()
        {
            var client = InputFactory.Client("TestService");
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var options = clientEntry?["properties"]?["Options"];
            Assert.IsNotNull(options, "Client entry should have an Options property");

            // Options should reference a local named definition that inherits from the base options
            var optionsRef = options!["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef, "Options should be a $ref");
            Assert.That(optionsRef, Does.StartWith("#/definitions/"), "Options $ref should point to a local definition");

            // Verify the local definition exists and inherits from base options via allOf
            var defName = optionsRef!.Replace("#/definitions/", "");
            var optionsDef = doc["definitions"]?[defName];
            Assert.IsNotNull(optionsDef, $"Local definition '{defName}' should exist");

            var allOf = optionsDef!["allOf"];
            Assert.IsNotNull(allOf, "Options definition should use allOf to inherit from base options");
            Assert.AreEqual("#/definitions/options", allOf!.AsArray()[0]?["$ref"]?.GetValue<string>());
        }

        [Test]
        public void Generate_IncludesOptionsDefinition_InheritingFromBase()
        {
            var client = InputFactory.Client("TestService");
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            // The options type should always be defined as a local definition that inherits from base options.
            // Common definitions (credential, base options) are provided by System.ClientModel base schema.
            var definitions = doc["definitions"];
            Assert.IsNotNull(definitions, "Schema should include local definitions for the options type");

            // Find the options definition and verify it inherits from the base options
            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var optionsRef = clientEntry?["properties"]?["Options"]?["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef, "Options should reference a local definition");
            var defName = optionsRef!.Replace("#/definitions/", "");
            var optionsDef = definitions![defName];
            Assert.IsNotNull(optionsDef, $"Options definition '{defName}' should exist");

            var allOf = optionsDef!["allOf"];
            Assert.IsNotNull(allOf, "Options definition should use allOf to inherit from base options");
            Assert.AreEqual("#/definitions/options", allOf!.AsArray()[0]?["$ref"]?.GetValue<string>(),
                "First allOf element should reference the base options type");
        }

        [Test]
        public void Generate_IncludesLocalDefinitions_ForEnumTypes()
        {
            // Create a non-api-version enum type
            var retryModeEnum = InputFactory.StringEnum(
                "RetryMode",
                [("Fixed", "Fixed"), ("Exponential", "Exponential")],
                isExtensible: false);

            // Reset and reload mock with the enum registered
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance", BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);
            MockHelpers.LoadMockGenerator(inputEnums: () => [retryModeEnum]);

            InputParameter[] inputParameters =
            [
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.QueryParameter(
                    "retryMode",
                    retryModeEnum,
                    isRequired: false,
                    defaultValue: new InputConstant("Exponential", retryModeEnum),
                    scope: InputParameterScope.Client,
                    isApiVersion: false)
            ];
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            // Verify local definitions contain the enum
            var definitions = doc["definitions"];
            Assert.IsNotNull(definitions, "Schema should include local definitions for non-base types");

            var retryModeDef = definitions!["retryMode"];
            Assert.IsNotNull(retryModeDef, "Definitions should include 'retryMode' enum");

            // Fixed enum should have enum values
            var enumValues = retryModeDef!["enum"];
            Assert.IsNotNull(enumValues, "Enum definition should have 'enum' values");

            // Verify the option property references the local definition via $ref
            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var options = clientEntry?["properties"]?["Options"];
            var optionsRef = options?["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef, "Options should reference a local definition");
            var optionsDefName = optionsRef!.Replace("#/definitions/", "");

            // The options definition should use allOf with custom properties
            var optionsDef = definitions![optionsDefName];
            Assert.IsNotNull(optionsDef, $"Options definition '{optionsDefName}' should exist");
            var allOf = optionsDef!["allOf"];
            Assert.IsNotNull(allOf, "Options definition should use allOf");

            var extensionProperties = allOf!.AsArray()[1]?["properties"];
            var retryModeProp = extensionProperties!["RetryMode"];
            Assert.IsNotNull(retryModeProp, "Custom option property should exist");
            Assert.AreEqual("#/definitions/retryMode", retryModeProp!["$ref"]?.GetValue<string>());
        }

        [Test]
        public void Generate_IncludesEndpointProperty_ForStringEndpoint()
        {
            var inputParameters = new[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true)
            };
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var endpoint = clientEntry?["properties"]?["Endpoint"];
            Assert.IsNotNull(endpoint, "Client entry should have an Endpoint property");
            Assert.AreEqual("string", endpoint!["type"]?.GetValue<string>());
        }

        [Test]
        public void Generate_IncludesEndpointProperty_ForUriEndpoint()
        {
            var inputParameters = new[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.Url,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true)
            };
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var endpoint = clientEntry?["properties"]?["Endpoint"];
            Assert.IsNotNull(endpoint, "Client entry should have an Endpoint property");
            Assert.AreEqual("string", endpoint!["type"]?.GetValue<string>());
            Assert.AreEqual("uri", endpoint!["format"]?.GetValue<string>());
        }

        [Test]
        public void Generate_IncludesOptionsAllOf_WhenClientHasCustomOptions()
        {
            InputParameter[] inputParameters =
            [
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.QueryParameter(
                    "enableTenantDiscovery",
                    InputPrimitiveType.Boolean,
                    isRequired: false,
                    defaultValue: new InputConstant(false, InputPrimitiveType.Boolean),
                    scope: InputParameterScope.Client,
                    isApiVersion: false)
            ];
            var client = InputFactory.Client("BlobService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["BlobService"];
            var options = clientEntry?["properties"]?["Options"];
            Assert.IsNotNull(options, "Client entry should have an Options property");

            // Options should reference a named local definition
            var optionsRef = options!["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef, "Options should be a $ref to a local definition");
            var defName = optionsRef!.Replace("#/definitions/", "");

            // Verify the local definition uses allOf to inherit from base options with custom properties
            var optionsDef = doc["definitions"]?[defName];
            Assert.IsNotNull(optionsDef, $"Options definition '{defName}' should exist");

            var allOf = optionsDef!["allOf"];
            Assert.IsNotNull(allOf, "Options definition should use allOf");

            var allOfArray = allOf!.AsArray();
            Assert.AreEqual(2, allOfArray.Count,
                "allOf should have base options ref + custom properties extension");
            Assert.AreEqual("#/definitions/options", allOfArray[0]?["$ref"]?.GetValue<string>());
            Assert.AreEqual("object", allOfArray[1]?["type"]?.GetValue<string>());

            // Verify the custom property is included
            var extensionProperties = allOfArray[1]?["properties"];
            Assert.IsNotNull(extensionProperties);
            var enableTenantDiscovery = extensionProperties!["EnableTenantDiscovery"];
            Assert.IsNotNull(enableTenantDiscovery, "Custom option property should be included");
            Assert.AreEqual("boolean", enableTenantDiscovery!["type"]?.GetValue<string>());
        }

        [Test]
        public void Generate_OptionsDefinition_IncludesStringProperty()
        {
            InputParameter[] inputParameters =
            [
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.QueryParameter(
                    "audience",
                    InputPrimitiveType.String,
                    isRequired: false,
                    defaultValue: new InputConstant("https://api.example.com", InputPrimitiveType.String),
                    scope: InputParameterScope.Client,
                    isApiVersion: false)
            ];
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var optionsRef = clientEntry?["properties"]?["Options"]?["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef);
            var defName = optionsRef!.Replace("#/definitions/", "");

            var optionsDef = doc["definitions"]?[defName];
            Assert.IsNotNull(optionsDef);

            var allOf = optionsDef!["allOf"]!.AsArray();
            Assert.AreEqual(2, allOf.Count, "allOf should have base options + extension");
            Assert.AreEqual("#/definitions/options", allOf[0]?["$ref"]?.GetValue<string>());

            var extensionProperties = allOf[1]?["properties"];
            Assert.IsNotNull(extensionProperties);
            var audienceProp = extensionProperties!["Audience"];
            Assert.IsNotNull(audienceProp, "String option property should exist");
            Assert.AreEqual("string", audienceProp!["type"]?.GetValue<string>());
        }

        [Test]
        public void Generate_OptionsDefinition_IncludesIntegerProperty()
        {
            InputParameter[] inputParameters =
            [
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.QueryParameter(
                    "maxRetries",
                    InputPrimitiveType.Int32,
                    isRequired: false,
                    defaultValue: new InputConstant(3, InputPrimitiveType.Int32),
                    scope: InputParameterScope.Client,
                    isApiVersion: false)
            ];
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var optionsRef = clientEntry?["properties"]?["Options"]?["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef);
            var defName = optionsRef!.Replace("#/definitions/", "");

            var optionsDef = doc["definitions"]?[defName];
            Assert.IsNotNull(optionsDef);

            var allOf = optionsDef!["allOf"]!.AsArray();
            Assert.AreEqual(2, allOf.Count, "allOf should have base options + extension");

            var extensionProperties = allOf[1]?["properties"];
            Assert.IsNotNull(extensionProperties);
            var maxRetriesProp = extensionProperties!["MaxRetries"];
            Assert.IsNotNull(maxRetriesProp, "Integer option property should exist");
            Assert.AreEqual("integer", maxRetriesProp!["type"]?.GetValue<string>());
        }

        [Test]
        public void Generate_OptionsDefinition_IncludesMultipleMixedProperties()
        {
            InputParameter[] inputParameters =
            [
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.QueryParameter(
                    "audience",
                    InputPrimitiveType.String,
                    isRequired: false,
                    defaultValue: new InputConstant("https://api.example.com", InputPrimitiveType.String),
                    scope: InputParameterScope.Client,
                    isApiVersion: false),
                InputFactory.QueryParameter(
                    "enableCaching",
                    InputPrimitiveType.Boolean,
                    isRequired: false,
                    defaultValue: new InputConstant(true, InputPrimitiveType.Boolean),
                    scope: InputParameterScope.Client,
                    isApiVersion: false),
                InputFactory.QueryParameter(
                    "maxRetries",
                    InputPrimitiveType.Int32,
                    isRequired: false,
                    defaultValue: new InputConstant(3, InputPrimitiveType.Int32),
                    scope: InputParameterScope.Client,
                    isApiVersion: false)
            ];
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var optionsRef = clientEntry?["properties"]?["Options"]?["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef);
            var defName = optionsRef!.Replace("#/definitions/", "");

            var optionsDef = doc["definitions"]?[defName];
            Assert.IsNotNull(optionsDef);

            var allOf = optionsDef!["allOf"]!.AsArray();
            Assert.AreEqual(2, allOf.Count, "allOf should have base options + extension with multiple properties");
            Assert.AreEqual("#/definitions/options", allOf[0]?["$ref"]?.GetValue<string>());
            Assert.AreEqual("object", allOf[1]?["type"]?.GetValue<string>());

            var extensionProperties = allOf[1]?["properties"];
            Assert.IsNotNull(extensionProperties);

            // Verify all three additional properties are present with correct types
            var audienceProp = extensionProperties!["Audience"];
            Assert.IsNotNull(audienceProp, "String option property should exist");
            Assert.AreEqual("string", audienceProp!["type"]?.GetValue<string>());

            var enableCachingProp = extensionProperties!["EnableCaching"];
            Assert.IsNotNull(enableCachingProp, "Boolean option property should exist");
            Assert.AreEqual("boolean", enableCachingProp!["type"]?.GetValue<string>());

            var maxRetriesProp = extensionProperties!["MaxRetries"];
            Assert.IsNotNull(maxRetriesProp, "Integer option property should exist");
            Assert.AreEqual("integer", maxRetriesProp!["type"]?.GetValue<string>());
        }

        [Test]
        public void Generate_OptionsDefinition_IncludesModelProperty()
        {
            // Create a model type with properties
            var retryPolicyModel = InputFactory.Model(
                "RetryPolicyConfig",
                properties:
                [
                    InputFactory.Property("MaxRetries", InputPrimitiveType.Int32),
                    InputFactory.Property("Delay", InputPrimitiveType.String)
                ]);

            // Reset and reload mock with the model registered
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance", BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);
            MockHelpers.LoadMockGenerator(inputModels: () => [retryPolicyModel]);

            InputParameter[] inputParameters =
            [
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.QueryParameter(
                    "retryPolicy",
                    retryPolicyModel,
                    isRequired: false,
                    defaultValue: new InputConstant(null, retryPolicyModel),
                    scope: InputParameterScope.Client,
                    isApiVersion: false)
            ];
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            // Verify local definitions contain the model
            var definitions = doc["definitions"];
            Assert.IsNotNull(definitions, "Schema should include local definitions");

            var retryPolicyDef = definitions!["retryPolicyConfig"];
            Assert.IsNotNull(retryPolicyDef, "Definitions should include 'retryPolicyConfig' model");
            Assert.AreEqual("object", retryPolicyDef!["type"]?.GetValue<string>());

            // Verify the model definition has its properties
            var modelProperties = retryPolicyDef["properties"];
            Assert.IsNotNull(modelProperties, "Model definition should have properties");
            Assert.IsNotNull(modelProperties!["MaxRetries"], "Model should have MaxRetries property");
            Assert.AreEqual("integer", modelProperties["MaxRetries"]!["type"]?.GetValue<string>());
            Assert.IsNotNull(modelProperties["Delay"], "Model should have Delay property");
            Assert.AreEqual("string", modelProperties["Delay"]!["type"]?.GetValue<string>());

            // Verify the options definition references the model via $ref
            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            var optionsRef = clientEntry?["properties"]?["Options"]?["$ref"]?.GetValue<string>();
            Assert.IsNotNull(optionsRef);
            var optionsDefName = optionsRef!.Replace("#/definitions/", "");

            var optionsDef = definitions[optionsDefName];
            Assert.IsNotNull(optionsDef);
            var allOf = optionsDef!["allOf"]!.AsArray();
            Assert.AreEqual(2, allOf.Count, "allOf should have base options + extension");

            var extensionProperties = allOf[1]?["properties"];
            Assert.IsNotNull(extensionProperties);
            var retryPolicyProp = extensionProperties!["RetryPolicy"];
            Assert.IsNotNull(retryPolicyProp, "Model option property should exist");
            Assert.AreEqual("#/definitions/retryPolicyConfig", retryPolicyProp!["$ref"]?.GetValue<string>());
        }

        [Test]
        public void Generate_ConstructorParameter_IncludesModelDefinition()
        {
            // Create a model type with properties to use as a required constructor parameter
            var connectionConfigModel = InputFactory.Model(
                "ConnectionConfig",
                properties:
                [
                    InputFactory.Property("Host", InputPrimitiveType.String),
                    InputFactory.Property("Port", InputPrimitiveType.Int32)
                ]);

            // Reset and reload mock with the model registered
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance", BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);
            MockHelpers.LoadMockGenerator(inputModels: () => [connectionConfigModel]);

            InputParameter[] inputParameters =
            [
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.QueryParameter(
                    "connectionConfig",
                    connectionConfigModel,
                    isRequired: true,
                    scope: InputParameterScope.Client,
                    isApiVersion: false)
            ];
            var client = InputFactory.Client("TestService", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            // Verify local definitions contain the model
            var definitions = doc["definitions"];
            Assert.IsNotNull(definitions, "Schema should include local definitions");

            var connectionConfigDef = definitions!["connectionConfig"];
            Assert.IsNotNull(connectionConfigDef, "Definitions should include 'connectionConfig' model");
            Assert.AreEqual("object", connectionConfigDef!["type"]?.GetValue<string>());

            // Verify the model definition has its properties
            var modelProperties = connectionConfigDef["properties"];
            Assert.IsNotNull(modelProperties, "Model definition should have properties");
            Assert.IsNotNull(modelProperties!["Host"], "Model should have Host property");
            Assert.AreEqual("string", modelProperties["Host"]!["type"]?.GetValue<string>());
            Assert.IsNotNull(modelProperties["Port"], "Model should have Port property");
            Assert.AreEqual("integer", modelProperties["Port"]!["type"]?.GetValue<string>());

            // Verify the model appears as a top-level constructor parameter property (not under Options)
            var clientEntry = doc["properties"]?["Clients"]?["properties"]?["TestService"];
            Assert.IsNotNull(clientEntry);
            var connectionConfigProp = clientEntry!["properties"]?["ConnectionConfig"];
            Assert.IsNotNull(connectionConfigProp, "Constructor parameter model should appear as top-level client property");
            Assert.AreEqual("#/definitions/connectionConfig", connectionConfigProp!["$ref"]?.GetValue<string>());

            var expected = GetExpectedJsonFromFile();
            Assert.AreEqual(expected, result);
        }

        [Test]
        public void Generate_HandlesMultipleClients()
        {
            var client1 = InputFactory.Client("ServiceA");
            var client2 = InputFactory.Client("ServiceB");
            var provider1 = new ClientProvider(client1);
            var provider2 = new ClientProvider(client2);

            var output = new TestOutputLibrary([provider1, provider2]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientsSection = doc["properties"]?["Clients"]?["properties"];
            Assert.IsNotNull(clientsSection?["ServiceA"], "Should include ServiceA");
            Assert.IsNotNull(clientsSection?["ServiceB"], "Should include ServiceB");

            var expected = GetExpectedJsonFromFile();
            Assert.AreEqual(expected, result);
        }

        [Test]
        public void Generate_IncludesAdditionalPropertiesOnSection()
        {
            var client = InputFactory.Client("TestService");
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            var clientsSection = doc["properties"]?["Clients"];
            var additionalProperties = clientsSection?["additionalProperties"];
            Assert.IsNotNull(additionalProperties, "Section should have additionalProperties for custom-named instances");
            Assert.AreEqual("object", additionalProperties!["type"]?.GetValue<string>());
        }

        [Test]
        public void Generate_ReturnsNull_WhenClientIsParentOnlyInitialized()
        {
            // Create a sub-client initialized by parent only
            var parentClient = InputFactory.Client("ParentService");
            var subClient = InputFactory.Client(
                "SubService",
                parent: parentClient,
                initializedBy: InputClientInitializedBy.Parent);
            var subProvider = new ClientProvider(subClient);

            // Sub-client with Parent initialization should NOT have ClientSettings
            Assert.IsNull(subProvider.ClientSettings);

            var output = new TestOutputLibrary([subProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);
            Assert.IsNull(result, "Should return null when no clients have settings");
        }

        [Test]
        public void GetJsonSchemaForType_ReturnsCorrectSchema_ForPrimitiveTypes()
        {
            // String
            var stringSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(string)));
            Assert.AreEqual("string", stringSchema["type"]?.GetValue<string>());

            // Boolean
            var boolSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(bool)));
            Assert.AreEqual("boolean", boolSchema["type"]?.GetValue<string>());

            // Integer types
            var intSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(int)));
            Assert.AreEqual("integer", intSchema["type"]?.GetValue<string>());

            var longSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(long)));
            Assert.AreEqual("integer", longSchema["type"]?.GetValue<string>());

            // Float types
            var floatSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(float)));
            Assert.AreEqual("number", floatSchema["type"]?.GetValue<string>());

            var doubleSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(double)));
            Assert.AreEqual("number", doubleSchema["type"]?.GetValue<string>());

            // Uri
            var uriSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(Uri)));
            Assert.AreEqual("string", uriSchema["type"]?.GetValue<string>());
            Assert.AreEqual("uri", uriSchema["format"]?.GetValue<string>());

            // TimeSpan
            var timeSpanSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(TimeSpan)));
            Assert.AreEqual("string", timeSpanSchema["type"]?.GetValue<string>());
        }

        [Test]
        public void GetJsonSchemaForType_ReturnsCorrectSchema_ForNullableTypes()
        {
            var nullableStringSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(string), isNullable: true));
            Assert.AreEqual("string", nullableStringSchema["type"]?.GetValue<string>());

            var nullableBoolSchema = ConfigurationSchemaGenerator.GetJsonSchemaForType(new CSharpType(typeof(bool), isNullable: true));
            Assert.AreEqual("boolean", nullableBoolSchema["type"]?.GetValue<string>());
        }

        /// <summary>
        /// Test output library that wraps provided TypeProviders.
        /// </summary>
        private class TestOutputLibrary : OutputLibrary
        {
            private readonly TypeProvider[] _types;

            public TestOutputLibrary(TypeProvider[] types)
            {
                _types = types;
            }

            protected override TypeProvider[] BuildTypeProviders() => _types;
        }
    }
}
