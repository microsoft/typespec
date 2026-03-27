// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
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
            Assert.AreEqual("http://json-schema.org/draft-07/schema#", doc["$schema"]?.GetValue<string>());
            Assert.AreEqual("object", doc["type"]?.GetValue<string>());

            // Since the default generator uses SCM (System.ClientModel), the section should be "Clients"
            var clients = doc["properties"]?["Clients"];
            Assert.IsNotNull(clients, "Schema should have a 'Clients' section for SCM clients");
            Assert.AreEqual("object", clients!["type"]?.GetValue<string>());

            var testClient = clients["properties"]?["TestService"];
            Assert.IsNotNull(testClient, "Schema should have a well-known 'TestService' entry");
            Assert.AreEqual("object", testClient!["type"]?.GetValue<string>());
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

            // Without client-specific options, should be a simple $ref
            Assert.AreEqual("#/definitions/options", options!["$ref"]?.GetValue<string>());
        }

        [Test]
        public void Generate_DoesNotIncludeBaseDefinitions_WhenNoCustomTypes()
        {
            var client = InputFactory.Client("TestService");
            var clientProvider = new ClientProvider(client);

            var output = new TestOutputLibrary([clientProvider]);
            var result = ConfigurationSchemaGenerator.Generate(output);

            Assert.IsNotNull(result);
            var doc = JsonNode.Parse(result!)!;

            // When no custom types (enums, models) are used, there should be no local definitions.
            // Common definitions (credential, options) are provided by System.ClientModel base schema.
            var definitions = doc["definitions"];
            Assert.IsNull(definitions, "Schema should not include local definitions when no custom types are used");
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
            var allOf = options?["allOf"];
            Assert.IsNotNull(allOf, "Options should use allOf when client has custom options");

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

            // When there are custom options, should use allOf
            var allOf = options!["allOf"];
            Assert.IsNotNull(allOf, "Options should use allOf when client has custom options");

            var allOfArray = allOf!.AsArray();
            Assert.AreEqual(2, allOfArray.Count);
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
