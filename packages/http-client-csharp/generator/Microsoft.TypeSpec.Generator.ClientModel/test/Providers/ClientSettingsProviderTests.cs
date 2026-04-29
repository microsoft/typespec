// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class ClientSettingsProviderTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestName()
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);
            Assert.AreEqual("TestClientSettings", settingsProvider!.Name);
        }

        [Test]
        public void TestBaseType()
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);
            Assert.AreEqual(ClientSettingsProvider.ClientSettingsType, settingsProvider!.Type.BaseType);
        }

        [Test]
        public void TestGeneratedSettings_WithStringEndpoint()
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
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            // Validate Endpoint property is string? (not Uri?)
            var properties = settingsProvider!.Properties;
            var endpointProp = properties.FirstOrDefault(p => p.Name == "Endpoint" && p.Type.Equals(new CSharpType(typeof(string), isNullable: true)));
            Assert.IsNotNull(endpointProp, "Settings should have an Endpoint property of type string?");

            var optionsProp = properties.FirstOrDefault(p => p.Name == "Options");
            Assert.IsNotNull(optionsProp, "Settings should have an Options property");

            // Validate BindCore method
            var bindCoreMethod = settingsProvider.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod, "Settings should have a BindCore method");
            Assert.AreEqual(
                MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override,
                bindCoreMethod!.Signature.Modifiers);
            Assert.AreEqual(1, bindCoreMethod.Signature.Parameters.Count);
            Assert.AreEqual("section", bindCoreMethod.Signature.Parameters[0].Name);
            var bodyString = bindCoreMethod.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("IsNullOrEmpty"), "BindCore should use string.IsNullOrEmpty for string endpoint binding");

            // Validate full generated output
            var writer = new TypeProviderWriter(settingsProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestProperties_NoEndpoint()
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            // Settings provider should exist but without endpoint-related properties
            Assert.IsNotNull(settingsProvider);

            var endpointProp = settingsProvider!.Properties.FirstOrDefault(p => p.Name == "Endpoint" && p.Type.Equals(new CSharpType(typeof(Uri), isNullable: true)));
            Assert.IsNull(endpointProp, "Settings should not have an Endpoint property when no endpoint parameter exists");
        }

        [Test]
        public void TestGeneratedSettings_WithUrlEndpoint()
        {
            var inputParameters = new[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.Url,
                    scope: InputParameterScope.Client,
                    isEndpoint: true)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            // Validate Endpoint property is Uri?
            var properties = settingsProvider!.Properties;
            var endpointProp = properties.FirstOrDefault(p => p.Name == "Endpoint" && p.Type.Equals(new CSharpType(typeof(Uri), isNullable: true)));
            Assert.IsNotNull(endpointProp, "Settings should have an Endpoint property of type Uri?");

            // Validate BindCore uses Uri.TryCreate
            var bindCoreMethod = settingsProvider.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);
            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("TryCreate"), "BindCore should use Uri.TryCreate for Uri endpoint binding");

            // Validate full generated output
            var writer = new TypeProviderWriter(settingsProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestBindCoreMethod_WithOptionsSection()
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
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var methods = settingsProvider!.Methods;
            var bindCoreMethod = methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            // Should get the options section and create options from it
            Assert.IsTrue(bodyString.Contains("GetSection") && bodyString.Contains("Options"),
                "BindCore should get the Options section from configuration");
        }

        [Test]
        public void TestBindCoreMethod_WithBoolParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "enableRetry",
                    InputPrimitiveType.Boolean,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("bool.TryParse"), "BindCore should use bool.TryParse for bool parameter binding");
            Assert.IsTrue(bodyString.Contains("EnableRetry"), "BindCore should assign to EnableRetry property");
        }

        [Test]
        public void TestBindCoreMethod_WithIntParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "maxRetries",
                    InputPrimitiveType.Int32,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("int.TryParse"), "BindCore should use int.TryParse for int parameter binding");
            Assert.IsTrue(bodyString.Contains("MaxRetries"), "BindCore should assign to MaxRetries property");
        }

        [Test]
        public void TestBindCoreMethod_WithStringParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "tenantId",
                    InputPrimitiveType.String,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("IsNullOrEmpty"), "BindCore should use string.IsNullOrEmpty for string parameter binding");
            Assert.IsTrue(bodyString.Contains("TenantId"), "BindCore should assign to TenantId property");
        }

        [Test]
        public void TestProperties_WithMultipleParamTypes()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "enableRetry",
                    InputPrimitiveType.Boolean,
                    isRequired: true,
                    scope: InputParameterScope.Client),
                InputFactory.MethodParameter(
                    "maxRetries",
                    InputPrimitiveType.Int32,
                    isRequired: true,
                    scope: InputParameterScope.Client),
                InputFactory.MethodParameter(
                    "tenantId",
                    InputPrimitiveType.String,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var properties = settingsProvider!.Properties;
            Assert.IsNotNull(properties.FirstOrDefault(p => p.Name == "Endpoint"), "Settings should have Endpoint property");
            Assert.IsNotNull(properties.FirstOrDefault(p => p.Name == "EnableRetry"), "Settings should have EnableRetry property");
            Assert.IsNotNull(properties.FirstOrDefault(p => p.Name == "MaxRetries"), "Settings should have MaxRetries property");
            Assert.IsNotNull(properties.FirstOrDefault(p => p.Name == "TenantId"), "Settings should have TenantId property");
            Assert.IsNotNull(properties.FirstOrDefault(p => p.Name == "Options"), "Settings should have Options property");
        }

        [Test]
        public void TestBindCoreMethod_WithUriParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "redirectUri",
                    InputPrimitiveType.Url,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("Uri.TryCreate"), "BindCore should use Uri.TryCreate for Uri parameter binding");
            Assert.IsTrue(bodyString.Contains("UriKind.Absolute"), "BindCore should use UriKind.Absolute");
            Assert.IsTrue(bodyString.Contains("RedirectUri"), "BindCore should assign to RedirectUri property");
        }

        [Test]
        public void TestBindCoreMethod_WithStringListParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "allowedTenants",
                    InputFactory.Array(InputPrimitiveType.String),
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("GetSection"), "BindCore should use GetSection for list parameter binding");
            Assert.IsTrue(bodyString.Contains("GetChildren"), "BindCore should use GetChildren for list parameter binding");
            Assert.IsTrue(bodyString.Contains("Where"), "BindCore should use Where to filter null values");
            Assert.IsTrue(bodyString.Contains("is not null"), "BindCore should use 'is not null' pattern in Where filter");
            Assert.IsTrue(bodyString.Contains("Select"), "BindCore should use Select to extract values");
            Assert.IsTrue(bodyString.Contains("ToList"), "BindCore should use ToList to materialize the list");
        }

        [Test]
        public void TestBindCoreMethod_WithEnumParam()
        {
            var enumType = InputFactory.StringEnum(
                "AppAudience",
                [("Public", "public"), ("Private", "private")],
                isExtensible: true);

            MockHelpers.LoadMockGenerator(inputEnums: () => [enumType]);

            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "audience",
                    enumType,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("is string"), "BindCore should use 'is string' pattern for enum parameter binding");
            Assert.IsTrue(bodyString.Contains("new"), "BindCore should create new enum instance");
            Assert.IsTrue(bodyString.Contains("Audience"), "BindCore should assign to Audience property");
        }

        [Test]
        public void TestBindCoreMethod_WithFixedEnumParam()
        {
            var enumType = InputFactory.StringEnum(
                "ClientMode",
                [("Default", "default"), ("MultiClient", "multi-client")],
                isExtensible: false);

            MockHelpers.LoadMockGenerator(inputEnums: () => [enumType]);

            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "mode",
                    enumType,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("Enum.TryParse"), "BindCore should use Enum.TryParse for fixed enum parameter binding");
            Assert.IsTrue(bodyString.Contains("Mode"), "BindCore should assign to Mode property");
            Assert.IsFalse(bodyString.Contains("new ClientMode"), "BindCore should NOT use new for fixed enum binding");
        }

        [Test]
        public void TestBindCoreMethod_WithTimeSpanParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "networkTimeout",
                    InputPrimitiveType.PlainTime,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("TimeSpan.TryParse"), "BindCore should use TimeSpan.TryParse for TimeSpan parameter binding");
            Assert.IsTrue(bodyString.Contains("NetworkTimeout"), "BindCore should assign to NetworkTimeout property");
        }

        [Test]
        public void TestBindCoreMethod_WithComplexObjectParam()
        {
            var complexModel = InputFactory.Model(
                "CustomOptions",
                properties: new[]
                {
                    InputFactory.Property("setting1", InputPrimitiveType.String, isRequired: true, wireName: "setting1"),
                    InputFactory.Property("setting2", InputPrimitiveType.Int32, isRequired: false, wireName: "setting2")
                });

            MockHelpers.LoadMockGenerator(inputModels: () => [complexModel]);

            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "customOptions",
                    complexModel,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("GetSection"), "BindCore should use GetSection for complex object binding");
            Assert.IsTrue(bodyString.Contains("Exists"), "BindCore should check Exists for complex object binding");
            Assert.IsTrue(bodyString.Contains("CustomOptions") && bodyString.Contains("new"), "BindCore should create new CustomOptions instance for complex object binding");
        }

        [Test]
        public void TestBindCoreMethod_WithLongParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "maxSize",
                    InputPrimitiveType.Int64,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("long.TryParse"), "BindCore should use long.TryParse for long parameter binding");
            Assert.IsTrue(bodyString.Contains("MaxSize"), "BindCore should assign to MaxSize property");
        }

        [Test]
        public void TestBindCoreMethod_WithFloatParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "temperature",
                    InputPrimitiveType.Float32,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("float.TryParse"), "BindCore should use float.TryParse for float parameter binding");
            Assert.IsTrue(bodyString.Contains("Temperature"), "BindCore should assign to Temperature property");
        }

        [Test]
        public void TestBindCoreMethod_WithDoubleParam()
        {
            var inputParameters = new InputParameter[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                    scope: InputParameterScope.Client,
                    isEndpoint: true),
                InputFactory.MethodParameter(
                    "precision",
                    InputPrimitiveType.Float64,
                    isRequired: true,
                    scope: InputParameterScope.Client)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("double.TryParse"), "BindCore should use double.TryParse for double parameter binding");
            Assert.IsTrue(bodyString.Contains("Precision"), "BindCore should assign to Precision property");
        }

        [Test]
        public void TestExperimentalAttribute()
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            var attributes = settingsProvider!.Attributes;
            Assert.IsNotNull(attributes);
            Assert.IsTrue(attributes.Any(), "Settings should have an Experimental attribute");
        }

        [Test]
        public void TestNamespace()
        {
            var client = InputFactory.Client("TestClient");
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);
            Assert.AreEqual(clientProvider.Type.Namespace, settingsProvider!.Type.Namespace);
        }

        // Sub-client settings tests

        [Test]
        public void TestSubClient_IndividuallyInitialized_HasSettings()
        {
            var endpointParam = InputFactory.EndpointParameter(
                "endpoint",
                InputPrimitiveType.String,
                defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                scope: InputParameterScope.Client,
                isEndpoint: true);
            var parentClient = InputFactory.Client("ParentClient", parameters: [endpointParam]);
            var subClient = InputFactory.Client(
                "SubClient",
                parent: parentClient,
                parameters: [endpointParam],
                initializedBy: InputClientInitializedBy.Individually);

            MockHelpers.LoadMockGenerator(
                auth: () => new(new InputApiKeyAuth("mock", null), null),
                clients: () => [parentClient]);

            var clientProvider = new ClientProvider(subClient);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider, "Individually-initialized sub-client should have ClientSettings");
            Assert.AreEqual("SubClientSettings", settingsProvider!.Name);
        }

        [Test]
        public void TestSubClient_ParentOnly_NoSettings()
        {
            var parentClient = InputFactory.Client("ParentClient");
            var subClient = InputFactory.Client(
                "SubClient",
                parent: parentClient,
                initializedBy: InputClientInitializedBy.Parent);

            MockHelpers.LoadMockGenerator(
                auth: () => new(new InputApiKeyAuth("mock", null), null),
                clients: () => [parentClient]);

            var clientProvider = new ClientProvider(subClient);

            Assert.IsNull(clientProvider.ClientSettings, "Parent-only sub-client should not have ClientSettings");
        }

        [Test]
        public void TestSubClient_IndividuallyInitialized_HasEndpointProperty()
        {
            var endpointParam = InputFactory.EndpointParameter(
                "endpoint",
                InputPrimitiveType.String,
                defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                scope: InputParameterScope.Client,
                isEndpoint: true);
            var parentClient = InputFactory.Client("ParentClient", parameters: [endpointParam]);
            var subClient = InputFactory.Client(
                "SubClient",
                parent: parentClient,
                parameters: [endpointParam],
                initializedBy: InputClientInitializedBy.Individually);

            MockHelpers.LoadMockGenerator(
                auth: () => new(new InputApiKeyAuth("mock", null), null),
                clients: () => [parentClient]);

            var clientProvider = new ClientProvider(subClient);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);
            var endpointProp = settingsProvider!.Properties.FirstOrDefault(
                p => p.Name == "Endpoint" && p.Type.Equals(new CSharpType(typeof(string), isNullable: true)));
            Assert.IsNotNull(endpointProp, "Sub-client settings should have an Endpoint property");
        }

        [Test]
        public void TestSubClient_IndividuallyInitialized_HasOptionsFromRootClient()
        {
            var endpointParam = InputFactory.EndpointParameter(
                "endpoint",
                InputPrimitiveType.String,
                defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                scope: InputParameterScope.Client,
                isEndpoint: true);
            var parentClient = InputFactory.Client("ParentClient", parameters: [endpointParam]);
            var subClient = InputFactory.Client(
                "SubClient",
                parent: parentClient,
                parameters: [endpointParam],
                initializedBy: InputClientInitializedBy.Individually);

            MockHelpers.LoadMockGenerator(
                auth: () => new(new InputApiKeyAuth("mock", null), null),
                clients: () => [parentClient]);

            var clientProvider = new ClientProvider(subClient);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);
            var optionsProp = settingsProvider!.Properties.FirstOrDefault(p => p.Name == "Options");
            Assert.IsNotNull(optionsProp, "Sub-client settings should have Options property from root client");

            // The Options type should be the parent's ClientOptions type
            var parentProvider = new ClientProvider(parentClient);
            Assert.IsNotNull(parentProvider.ClientOptions);
            Assert.AreEqual(
                parentProvider.ClientOptions!.Type.WithNullable(true),
                optionsProp!.Type,
                "Sub-client settings Options type should match root client's ClientOptions type");
        }

        [Test]
        public void TestSubClient_IndividuallyInitialized_BindCoreHasEndpointAndOptions()
        {
            var endpointParam = InputFactory.EndpointParameter(
                "endpoint",
                InputPrimitiveType.String,
                defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                scope: InputParameterScope.Client,
                isEndpoint: true);
            var parentClient = InputFactory.Client("ParentClient", parameters: [endpointParam]);
            var subClient = InputFactory.Client(
                "SubClient",
                parent: parentClient,
                parameters: [endpointParam],
                initializedBy: InputClientInitializedBy.Individually);

            MockHelpers.LoadMockGenerator(
                auth: () => new(new InputApiKeyAuth("mock", null), null),
                clients: () => [parentClient]);

            var clientProvider = new ClientProvider(subClient);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);
            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod, "Sub-client settings should have BindCore method");

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("IsNullOrEmpty"), "BindCore should bind the Endpoint via string.IsNullOrEmpty for string endpoint");
            Assert.IsTrue(bodyString.Contains("GetSection") && bodyString.Contains("Options"),
                "BindCore should bind the Options section");
        }

        [Test]
        public void TestSubClient_IndividuallyInitialized_SettingsBaseType()
        {
            var endpointParam = InputFactory.EndpointParameter(
                "endpoint",
                InputPrimitiveType.String,
                defaultValue: InputFactory.Constant.String("https://default.endpoint.io"),
                scope: InputParameterScope.Client,
                isEndpoint: true);
            var parentClient = InputFactory.Client("ParentClient", parameters: [endpointParam]);
            var subClient = InputFactory.Client(
                "SubClient",
                parent: parentClient,
                parameters: [endpointParam],
                initializedBy: InputClientInitializedBy.Individually);

            MockHelpers.LoadMockGenerator(
                auth: () => new(new InputApiKeyAuth("mock", null), null),
                clients: () => [parentClient]);

            var clientProvider = new ClientProvider(subClient);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);
            Assert.AreEqual(ClientSettingsProvider.ClientSettingsType, settingsProvider!.Type.BaseType,
                "Sub-client settings should inherit from ClientSettings");
        }

        [Test]
        public void TestGeneratedSettings_WithNamedStringEndpoint()
        {
            var inputParameters = new[]
            {
                InputFactory.EndpointParameter(
                    "fullyQualifiedNamespace",
                    InputPrimitiveType.String,
                    scope: InputParameterScope.Client,
                    isEndpoint: true,
                    serverUrlTemplate: "https://{fullyQualifiedNamespace}")
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);
            var settingsProvider = clientProvider.ClientSettings;

            Assert.IsNotNull(settingsProvider);

            // Validate FullyQualifiedNamespace property is string? (not Uri?)
            var properties = settingsProvider!.Properties;
            var endpointProp = properties.FirstOrDefault(p => p.Name == "FullyQualifiedNamespace" && p.Type.Equals(new CSharpType(typeof(string), isNullable: true)));
            Assert.IsNotNull(endpointProp, "Settings should have a FullyQualifiedNamespace property of type string?");

            // Validate full generated output
            var writer = new TypeProviderWriter(settingsProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestSettingsConstructor_WithStringEndpoint()
        {
            var inputParameters = new[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    scope: InputParameterScope.Client,
                    isEndpoint: true,
                    serverUrlTemplate: "https://{endpoint}")
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var settingsConstructor = clientProvider.Constructors.FirstOrDefault(IsSettingsConstructor);
            Assert.IsNotNull(settingsConstructor, "Expected a settings constructor for string endpoint");

            // Validate the initializer references the settings endpoint property
            var initializer = settingsConstructor!.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsFalse(initializer!.IsBase, "Settings constructor should use this() initializer");

            // The initializer should have arguments for auth policy, endpoint, and options
            Assert.IsTrue(initializer.Arguments.Count >= 3,
                "Settings constructor initializer should have at least 3 arguments (auth, endpoint, options)");

            // Validate the endpoint argument references settings?.Endpoint
            var endpointArg = initializer.Arguments[1].ToDisplayString();
            Assert.IsTrue(endpointArg.Contains("Endpoint"),
                $"Endpoint argument should reference Endpoint property, got: {endpointArg}");

            // Validate full generated client output
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestSettingsConstructor_WithUrlEndpoint()
        {
            var inputParameters = new[]
            {
                InputFactory.EndpointParameter(
                    "endpoint",
                    InputPrimitiveType.Url,
                    scope: InputParameterScope.Client,
                    isEndpoint: true)
            };
            var client = InputFactory.Client("TestClient", parameters: inputParameters);
            var clientProvider = new ClientProvider(client);

            var settingsConstructor = clientProvider.Constructors.FirstOrDefault(IsSettingsConstructor);
            Assert.IsNotNull(settingsConstructor, "Expected a settings constructor for URL endpoint");

            // Validate the initializer references the settings endpoint property
            var initializer = settingsConstructor!.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsFalse(initializer!.IsBase, "Settings constructor should use this() initializer");

            // The initializer should have arguments for auth policy, endpoint, and options
            Assert.IsTrue(initializer.Arguments.Count >= 3,
                "Settings constructor initializer should have at least 3 arguments (auth, endpoint, options)");

            // Validate the endpoint argument references settings?.Endpoint
            var endpointArg = initializer.Arguments[1].ToDisplayString();
            Assert.IsTrue(endpointArg.Contains("Endpoint"),
                $"Endpoint argument should reference Endpoint property, got: {endpointArg}");

            // Validate full generated client output
            var writer = new TypeProviderWriter(clientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task TestBindCoreMethod_WithCustomStructParam()
        {
            // A custom struct with a string constructor should use string binding
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance",
                BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var typeProvider = CodeModelGenerator.Instance.SourceInputModel
                .FindForTypeInCustomization("SampleNamespace", "CustomAudience");
            Assert.IsNotNull(typeProvider, "CustomAudience should be found in custom code");

            var body = new List<MethodBodyStatement>();
            var sectionParam = new ParameterProvider(
                "section",
                $"The configuration section.",
                ClientSettingsProvider.IConfigurationSectionType);

            ClientSettingsProvider.AppendBindingForProperty(body, sectionParam, "Audience", "audience", typeProvider!.Type);

            var bodyString = string.Join("\n", body.Select(s => s.ToDisplayString()));
            Assert.IsTrue(bodyString.Contains("is string"),
                "Should use 'is string' pattern for custom struct with string constructor");
            Assert.IsFalse(bodyString.Contains("GetSection"),
                "Should NOT use GetSection for custom struct with string constructor");
        }

        [Test]
        public async Task TestBindCoreMethod_WithCustomIntStructParam()
        {
            // A custom struct with an int constructor should use int.TryParse binding
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance",
                BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var typeProvider = CodeModelGenerator.Instance.SourceInputModel
                .FindForTypeInCustomization("SampleNamespace", "CustomPriority");
            Assert.IsNotNull(typeProvider, "CustomPriority should be found in custom code");

            var body = new List<MethodBodyStatement>();
            var sectionParam = new ParameterProvider(
                "section",
                $"The configuration section.",
                ClientSettingsProvider.IConfigurationSectionType);

            ClientSettingsProvider.AppendBindingForProperty(body, sectionParam, "Priority", "priority", typeProvider!.Type);

            var bodyString = string.Join("\n", body.Select(s => s.ToDisplayString()));
            Assert.IsTrue(bodyString.Contains("int.TryParse"),
                "Should use int.TryParse for custom struct with int constructor");
            Assert.IsFalse(bodyString.Contains("GetSection"),
                "Should NOT use GetSection for custom struct with int constructor");
        }

        [Test]
        public async Task TestBindCoreMethod_WithCustomStructParam_FallsBackToComplexObject()
        {
            // A custom struct with no single-parameter framework-type constructor
            // should fall back to complex object binding
            var singletonField = typeof(ClientOptionsProvider).GetField("_singletonInstance",
                BindingFlags.Static | BindingFlags.NonPublic);
            singletonField?.SetValue(null, null);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var typeProvider = CodeModelGenerator.Instance.SourceInputModel
                .FindForTypeInCustomization("SampleNamespace", "CustomComplex");
            Assert.IsNotNull(typeProvider, "CustomComplex should be found in custom code");

            var body = new List<MethodBodyStatement>();
            var sectionParam = new ParameterProvider(
                "section",
                $"The configuration section.",
                ClientSettingsProvider.IConfigurationSectionType);

            ClientSettingsProvider.AppendBindingForProperty(body, sectionParam, "Complex", "complex", typeProvider!.Type);

            var bodyString = string.Join("\n", body.Select(s => s.ToDisplayString()));
            Assert.IsTrue(bodyString.Contains("GetSection"),
                "Should fall back to GetSection for struct with no single-parameter framework-type constructor");
        }

        private static bool IsSettingsConstructor(ConstructorProvider c) =>
            c.Signature?.Initializer != null &&
            c.Signature?.Modifiers == MethodSignatureModifiers.Public &&
            c.Signature.Parameters.Any(p => p.Name == "settings");

        [Test]
        public async Task TestProperties_IncludesCustomConstructorParameters()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);
            Assert.IsNotNull(clientProvider!.CustomCodeView,
                "CustomCodeView should be available from the compilation");

            var settings = clientProvider.ClientSettings;
            Assert.IsNotNull(settings);

            var connectionStringProp = settings!.Properties
                .FirstOrDefault(p => p.Name == "ConnectionString");
            Assert.IsNotNull(connectionStringProp,
                "Settings should include 'ConnectionString' property from custom constructor parameter");
        }

        [Test]
        public async Task TestBindCoreMethod_BindsCustomConstructorParameters()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            var settings = clientProvider!.ClientSettings;
            Assert.IsNotNull(settings);

            var bindCoreMethod = settings!.Methods
                .FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("ConnectionString"),
                "BindCore should bind the custom constructor parameter 'ConnectionString' from configuration");
        }

        [Test]
        public async Task TestSettingsType_DoesNotContainSelfReferentialSettingsProperty()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            var settingsProvider = clientProvider!.ClientSettings;
            Assert.IsNotNull(settingsProvider);

            var settingsProperty = settingsProvider!.Properties.FirstOrDefault(p => p.Name == "Settings");
            Assert.IsNull(settingsProperty,
                "Settings type should not contain a self-referential 'Settings' property");
        }

        [Test]
        public async Task TestBindCoreMethod_DoesNotBindSettingsParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            var settingsProvider = clientProvider!.ClientSettings;
            Assert.IsNotNull(settingsProvider);

            var bindCoreMethod = settingsProvider!.Methods.FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsFalse(bodyString.Contains("GetSection(\"Settings\")"),
                "BindCore should not bind a self-referential Settings section");
        }

        [Test]
        public async Task TestProperties_ExcludesDerivedCredentialParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);
            Assert.IsNotNull(clientProvider!.CustomCodeView,
                "CustomCodeView should be available from the compilation");

            var settings = clientProvider.ClientSettings;
            Assert.IsNotNull(settings);

            // The custom constructor has a MyCustomCredential parameter (derives from AuthenticationTokenProvider).
            // It should be excluded from settings properties because it is a credential type.
            var credentialProp = settings!.Properties
                .FirstOrDefault(p => p.Name == "Credential" || p.Name == "MyCredential");
            Assert.IsNull(credentialProp,
                "Settings should NOT include a property for a parameter whose type derives from TokenCredentialType");

            // Verify that a normal parameter from the same constructor IS included
            var tenantIdProp = settings.Properties
                .FirstOrDefault(p => p.Name == "TenantId");
            Assert.IsNotNull(tenantIdProp,
                "Settings should include the non-credential parameter 'TenantId' from the custom constructor");
        }

        [Test]
        public async Task TestBindCoreMethod_ExcludesDerivedCredentialParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = InputFactory.Client("TestClient", clientNamespace: "SampleNamespace");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            var settings = clientProvider!.ClientSettings;
            Assert.IsNotNull(settings);

            var bindCoreMethod = settings!.Methods
                .FirstOrDefault(m => m.Signature.Name == "BindCore");
            Assert.IsNotNull(bindCoreMethod);

            var bodyString = bindCoreMethod!.BodyStatements!.ToDisplayString();
            Assert.IsFalse(bodyString.Contains("MyCredential"),
                "BindCore should NOT bind a credential-derived parameter");
            Assert.IsTrue(bodyString.Contains("TenantId"),
                "BindCore should bind the non-credential parameter 'TenantId'");
        }
    }
}
