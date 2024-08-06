// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    public class ClientProviderTests
    {
        [OneTimeSetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin(apiKeyAuth: () => new InputApiKeyAuth("mock", null));
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

        [TestCaseSource(nameof(BuildFieldsTestCases))]
        public void TestBuildFields(List<InputParameter> inputParameters, bool containsAdditionalOptionalParams)
        {
            var client = new InputClient("TestClient", "TestClient description", [], inputParameters, null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            // validate the fields
            var fields = clientProvider.Fields;
            if (containsAdditionalOptionalParams)
            {
                Assert.AreEqual(6, fields.Count);

            }
            else
            {
                Assert.AreEqual(3, fields.Count);
            }

            // validate the endpoint field
            if (inputParameters.Any(p => p.IsEndpoint))
            {
                var endpointField = fields.FirstOrDefault(f => f.Name == "_endpoint");
                Assert.IsNotNull(endpointField);
                Assert.AreEqual(new CSharpType(typeof(Uri)), endpointField?.Type);
            }

            // validate other optional parameters as fields
            if (containsAdditionalOptionalParams)
            {
                var optionalParamField = fields.FirstOrDefault(f => f.Name == "_optionalParam");
                Assert.IsNotNull(optionalParamField);
                Assert.AreEqual(new CSharpType(typeof(string)), optionalParamField?.Type);

                var optionalParam2Field = fields.FirstOrDefault(f => f.Name == "_optionalParam2");
                Assert.IsNotNull(optionalParam2Field);
                Assert.AreEqual(new CSharpType(typeof(string)), optionalParam2Field?.Type);

                var optionalParam3Field = fields.FirstOrDefault(f => f.Name == "_optionalParam3");
                Assert.IsNotNull(optionalParam3Field);
                Assert.AreEqual(new CSharpType(typeof(long)), optionalParam3Field?.Type);
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        public void TestBuildConstructors_PrimaryConstructor(List<InputParameter> inputParameters)
        {
            var client = new InputClient("TestClient", "TestClient description", [], inputParameters, null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;
            Assert.AreEqual(3, constructors.Count);

            var primaryPublicConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            ValidatePrimaryConstructor(primaryPublicConstructor, inputParameters);
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        public void TestBuildConstructors_SecondaryConstructor(List<InputParameter> inputParameters)
        {
            var client = new InputClient("TestClient", "TestClient description", [], inputParameters, null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            Assert.AreEqual(3, constructors.Count);
            var primaryPublicConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);

            Assert.IsNotNull(primaryPublicConstructor);

            var secondaryPublicConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Initializer != null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            ValidateSecondaryConstructor(primaryPublicConstructor, secondaryPublicConstructor, inputParameters);
        }

        private void ValidatePrimaryConstructor(
            ConstructorProvider? primaryPublicConstructor,
            List<InputParameter> inputParameters)
        {
            Assert.IsNotNull(primaryPublicConstructor);

            var primaryCtorParams = primaryPublicConstructor?.Signature?.Parameters;
            var expectedPrimaryCtorParamCount = 3;

            Assert.AreEqual(expectedPrimaryCtorParamCount, primaryCtorParams?.Count);

            // validate the order of the parameters (endpoint, credential, client options)
            var endpointParam = primaryCtorParams?[0];
            Assert.AreEqual(KnownParameters.Endpoint.Name, endpointParam?.Name);
            Assert.AreEqual("keyCredential", primaryCtorParams?[1].Name);
            Assert.AreEqual("options", primaryCtorParams?[2].Name);

            if (endpointParam?.DefaultValue != null)
            {
                var inputEndpointParam = inputParameters.FirstOrDefault(p => p.IsEndpoint);
                var parsedValue = inputEndpointParam?.DefaultValue?.Value;
                Assert.AreEqual(Snippet.Literal(parsedValue), endpointParam?.InitializationValue);
            }

            // validate the body of the primary ctor
            var primaryCtorBody = primaryPublicConstructor?.BodyStatements;
            Assert.IsNotNull(primaryCtorBody);
        }

        private void ValidateSecondaryConstructor(
            ConstructorProvider? primaryConstructor,
            ConstructorProvider? secondaryPublicConstructor,
            List<InputParameter> inputParameters)
        {
            Assert.IsNotNull(secondaryPublicConstructor);
            var ctorParams = secondaryPublicConstructor?.Signature?.Parameters;

            // secondary ctor should consist of all required parameters + auth parameter
            var requiredParams = inputParameters.Where(p => p.IsRequired).ToList();
            Assert.AreEqual(requiredParams.Count + 1, ctorParams?.Count);
            var endpointParam = ctorParams?.FirstOrDefault(p => p.Name == KnownParameters.Endpoint.Name);

            if (requiredParams.Count == 0)
            {
                // auth should be the only parameter if endpoint is optional
                Assert.AreEqual("keyCredential", ctorParams?[0].Name);
            }
            else
            {
                // otherwise, it should only consist of the auth parameter
                Assert.AreEqual(KnownParameters.Endpoint.Name, ctorParams?[0].Name);
                Assert.AreEqual("keyCredential", ctorParams?[1].Name);
            }

            Assert.AreEqual(MethodBodyStatement.Empty, secondaryPublicConstructor?.BodyStatements);

            // validate the initializer
            var initializer = secondaryPublicConstructor?.Signature?.Initializer;
            Assert.AreEqual(primaryConstructor?.Signature?.Parameters?.Count, initializer?.Arguments?.Count);
        }

        [TestCaseSource(nameof(EndpointParamInitializationValueTestCases))]
        public void EndpointInitializationValue(InputParameter endpointParameter, ValueExpression? expectedValue)
        {
            var client = new InputClient("TestClient", "TestClient description", [], [endpointParameter], null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);
            // find the endpoint parameter from the primary constructor
            var primaryConstructor = clientProvider.Constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            var endpoint = primaryConstructor?.Signature?.Parameters?.FirstOrDefault(p => p.Name == KnownParameters.Endpoint.Name);

            Assert.IsNotNull(endpoint);
            Assert.AreEqual(expectedValue?.GetType(), endpoint?.InitializationValue?.GetType());
            if (expectedValue != null)
            {
                Assert.IsTrue(endpoint?.InitializationValue is NewInstanceExpression);
            }
        }

        public static IEnumerable<TestCaseData> BuildFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        KnownParameters.Endpoint.Name,
                        "endpoint description",
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, isEndpoint: true, false, false, null, null)
                }, false);
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam2",
                        "optionalParam description",
                        "optionalParam2",
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam3",
                        "optionalParam description",
                        "optionalParam3",
                        InputPrimitiveType.Int64,
                        RequestLocation.None,
                        defaultValue: new InputConstant(2, InputPrimitiveType.Int64),
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        KnownParameters.Endpoint.Name,
                        "endpoint description",
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, isEndpoint: true, false, false, null, null)
                }, true);
            }
        }

        public static IEnumerable<TestCaseData> BuildConstructorsTestCases
        {
            get
            {
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        KnownParameters.Endpoint.Name,
                        "endpoint description",
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, isEndpoint: true, false, false, null, null)
                });
                // scenario where endpoint is required
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        KnownParameters.Endpoint.Name,
                        "endpoint description",
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, isEndpoint: true, false, false, null, null),
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        InputPrimitiveType.String,
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null)
                });
            }
        }

        private static IEnumerable<TestCaseData> EndpointParamInitializationValueTestCases()
        {
            // string primitive type
            yield return new TestCaseData(
                new InputParameter(
                    "param",
                    "param description",
                    "param",
                    InputPrimitiveType.String,
                    RequestLocation.None,
                    defaultValue: new InputConstant("mockValue", InputPrimitiveType.String),
                    InputOperationParameterKind.Client,
                    isRequired: false, false, false, false, true, false, false, null, null),
                New.Instance(KnownParameters.Endpoint.Type, Literal("mockvalue")));
        }
    }
}
