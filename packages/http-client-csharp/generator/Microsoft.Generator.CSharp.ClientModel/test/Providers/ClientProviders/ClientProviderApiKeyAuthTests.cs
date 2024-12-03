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
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderApiKeyAuthTests
    {
        private const string SubClientsCategory = "WithSubClients";
        private const string TestClientName = "TestClient";
        private static readonly InputClient _animalClient = new("animal", "AnimalClient description", [], [], TestClientName);
        private static readonly InputClient _dogClient = new("dog", "DogClient description", [], [], _animalClient.Name);
        private static readonly InputClient _huskyClient = new("husky", "HuskyClient description", [], [], _dogClient.Name);

        [SetUp]
        public void SetUp()
        {
            var categories = TestContext.CurrentContext.Test?.Properties["Category"];
            bool containsSubClients = categories?.Contains(SubClientsCategory) ?? false;

            if (containsSubClients)
            {
                MockHelpers.LoadMockPlugin(
                    apiKeyAuth: () => new InputApiKeyAuth("mock", null),
                    clients: () => [_animalClient, _dogClient, _huskyClient]);
            }
            else
            {
                MockHelpers.LoadMockPlugin(apiKeyAuth: () => new InputApiKeyAuth("mock", null));
            }
        }

        [Test]
        public void TestBuildProperties()
        {
            var client = InputFactory.Client(TestClientName);
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
        public void TestBuildFields(List<InputParameter> inputParameters, bool containsAdditionalParams)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            // validate the fields
            var fields = clientProvider.Fields;
            if (containsAdditionalParams)
            {
                Assert.AreEqual(6, fields.Count);

            }
            else
            {
                Assert.AreEqual(4, fields.Count);
            }

            // validate the endpoint field
            if (inputParameters.Any(p => p.IsEndpoint))
            {
                var endpointField = fields.FirstOrDefault(f => f.Name == "_endpoint");
                Assert.IsNotNull(endpointField);
                Assert.AreEqual(new CSharpType(typeof(Uri)), endpointField?.Type);
            }

            // validate other parameters as fields
            if (containsAdditionalParams)
            {
                var optionalParamField = fields.FirstOrDefault(f => f.Name == "_optionalNullableParam");
                Assert.IsNotNull(optionalParamField);
                Assert.AreEqual(new CSharpType(typeof(string), isNullable: true), optionalParamField?.Type);

                var requiredParam2Field = fields.FirstOrDefault(f => f.Name == "_requiredParam2");
                Assert.IsNotNull(requiredParam2Field);
                Assert.AreEqual(new CSharpType(typeof(string), isNullable: false), requiredParam2Field?.Type);

                var requiredParam3Field = fields.FirstOrDefault(f => f.Name == "_requiredParam3");
                Assert.IsNotNull(requiredParam3Field);
                Assert.AreEqual(new CSharpType(typeof(long), isNullable: false), requiredParam3Field?.Type);
            }
        }

        // validates the fields are built correctly when a client has sub-clients
        [TestCaseSource(nameof(SubClientTestCases), Category = SubClientsCategory)]
        public void TestBuildFields_WithSubClients(InputClient client, bool hasSubClients)
        {
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            // validate the fields
            var fields = clientProvider.Fields;

            // validate the endpoint field
            var endpointField = fields.FirstOrDefault(f => f.Name == "_endpoint");
            Assert.IsNotNull(endpointField);
            Assert.AreEqual(new CSharpType(typeof(Uri)), endpointField?.Type);

            // there should be n number of caching client fields for every direct sub-client + endpoint field + auth fields
            if (hasSubClients)
            {
                Assert.AreEqual(4, fields.Count);
                var cachedClientFields = fields.Where(f => f.Name.StartsWith("_cached"));
                Assert.AreEqual(1, cachedClientFields.Count());
            }
            else
            {
                // The 3 fields are _endpoint, AuthorizationHeader, and _keyCredential
                Assert.AreEqual(3, fields.Count);
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        public void TestBuildConstructors_PrimaryConstructor(List<InputParameter> inputParameters)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
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
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
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

        [Test]
        public void TestBuildConstructors_ForSubClient()
        {
            var clientProvider = new ClientProvider(_animalClient);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            Assert.AreEqual(2, constructors.Count);
            var internalConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Internal);
            Assert.IsNotNull(internalConstructor);
            var ctorParams = internalConstructor?.Signature?.Parameters;
            Assert.AreEqual(3, ctorParams?.Count);

            var mockingConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Protected);
            Assert.IsNotNull(mockingConstructor);
        }

        private static void ValidatePrimaryConstructor(
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
                Assert.AreEqual(Literal(parsedValue), endpointParam?.InitializationValue);
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
            var client = InputFactory.Client(TestClientName, parameters: [endpointParameter]);
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

        [TestCaseSource(nameof(SubClientTestCases), Category = SubClientsCategory)]
        public void TestSubClientAccessorFactoryMethods(InputClient client, bool hasSubClients)
        {
            var clientProvider = new ClientProvider(client);
            Assert.IsNotNull(clientProvider);

            var methods = clientProvider.Methods;
            List<MethodProvider> subClientAccessorFactoryMethods = [];
            foreach (var method in methods)
            {
                var methodSignature = method.Signature;
                if (methodSignature != null &&
                    methodSignature.Name.StartsWith("Get") &&
                    methodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual))
                {
                    subClientAccessorFactoryMethods.Add(method);
                }
            }

            if (hasSubClients)
            {
                Assert.AreEqual(1, subClientAccessorFactoryMethods.Count);
                var factoryMethod = subClientAccessorFactoryMethods[0];
                Assert.AreEqual(0, factoryMethod.Signature?.Parameters.Count);

                // method body should not be empty
                Assert.AreNotEqual(MethodBodyStatement.Empty, factoryMethod.BodyStatements);
            }
            else
            {
                Assert.AreEqual(0, subClientAccessorFactoryMethods.Count);
            }
        }

        public static IEnumerable<TestCaseData> BuildFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(new List<InputParameter>
                {
                    InputFactory.Parameter(
                        "optionalParam",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        kind: InputOperationParameterKind.Client),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location:RequestLocation.None,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                }, false);
                yield return new TestCaseData(new List<InputParameter>
                {
                    // have to explicitly set isRequired because we now call CreateParameter in buildFields
                    InputFactory.Parameter(
                        "optionalNullableParam",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isRequired: false),
                    InputFactory.Parameter(
                        "requiredParam2",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isRequired: true),
                    InputFactory.Parameter(
                        "requiredParam3",
                        InputPrimitiveType.Int64,
                        location: RequestLocation.None,
                        defaultValue: InputFactory.Constant.Int64(2),
                        kind: InputOperationParameterKind.Client,
                        isRequired: true),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        defaultValue: null,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                }, true);
            }
        }

        public static IEnumerable<TestCaseData> SubClientTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Client(TestClientName), true);
                yield return new TestCaseData(_animalClient, true);
                yield return new TestCaseData(_dogClient, true);
                yield return new TestCaseData(_huskyClient, false);
            }
        }

        public static IEnumerable<TestCaseData> BuildConstructorsTestCases
        {
            get
            {
                yield return new TestCaseData(new List<InputParameter>
                {
                    InputFactory.Parameter(
                        "optionalParam",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        kind: InputOperationParameterKind.Client),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                });
                // scenario where endpoint is required
                yield return new TestCaseData(new List<InputParameter>
                {
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        kind: InputOperationParameterKind.Client,
                        isRequired: true,
                        isEndpoint: true),
                    InputFactory.Parameter(
                        "optionalParam",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        kind: InputOperationParameterKind.Client)
                });
            }
        }

        private static IEnumerable<TestCaseData> EndpointParamInitializationValueTestCases
        {
            get
            {
                // string primitive type
                yield return new TestCaseData(
                    InputFactory.Parameter(
                        "param",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true,
                        defaultValue: InputFactory.Constant.String("mockValue")),
                    New.Instance(KnownParameters.Endpoint.Type, Literal("mockvalue")));
            }
        }
    }
}
