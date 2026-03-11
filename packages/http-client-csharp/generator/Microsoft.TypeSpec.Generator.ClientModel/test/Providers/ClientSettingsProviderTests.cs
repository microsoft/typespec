// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
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
        public void TestProperties_WithEndpoint()
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

            var properties = settingsProvider!.Properties;
            // Should have Endpoint and Options properties
            var endpointProp = properties.FirstOrDefault(p => p.Name == "Endpoint" && p.Type.Equals(new CSharpType(typeof(Uri), isNullable: true)));
            Assert.IsNotNull(endpointProp, "Settings should have an Endpoint property of type Uri?");

            var optionsProp = properties.FirstOrDefault(p => p.Name == "Options");
            Assert.IsNotNull(optionsProp, "Settings should have an Options property");
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
        public void TestBindCoreMethod_WithEndpoint()
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
            Assert.IsNotNull(bindCoreMethod, "Settings should have a BindCore method");

            // Validate it's protected override
            Assert.AreEqual(
                MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override,
                bindCoreMethod!.Signature.Modifiers);

            // Validate it has section parameter
            Assert.AreEqual(1, bindCoreMethod.Signature.Parameters.Count);
            Assert.AreEqual("section", bindCoreMethod.Signature.Parameters[0].Name);

            // Validate the body contains Uri.TryCreate for endpoint binding
            var body = bindCoreMethod.BodyStatements;
            Assert.IsNotNull(body);
            var bodyString = body!.ToDisplayString();
            Assert.IsTrue(bodyString.Contains("TryCreate"), "BindCore should use Uri.TryCreate for endpoint binding");
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
    }
}
