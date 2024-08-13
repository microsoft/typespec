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

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderTests
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
            var client = new InputClient(TestClientName, "TestClient description", [], [], null);
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
            var client = new InputClient(TestClientName, "TestClient description", [], inputParameters, null);
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
                Assert.AreEqual(3, fields.Count);
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        public void TestBuildConstructors_PrimaryConstructor(List<InputParameter> inputParameters)
        {
            var client = new InputClient(TestClientName, "TestClient description", [], inputParameters, null);
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
            var client = new InputClient(TestClientName, "TestClient description", [], inputParameters, null);
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
            var client = new InputClient(TestClientName, "TestClient description", [], [endpointParameter], null);
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

        [TestCase(true)]
        [TestCase(false)]
        public void TestGetClientOptions(bool isSubClient)
        {
            string? parentClientName = null;
            if (isSubClient)
            {
                parentClientName = "parent";
            }

            var client = new InputClient(TestClientName, "TestClient description", [], [], parentClientName);
            var clientProvider = new ClientProvider(client);

            if (isSubClient)
            {
                Assert.IsNull(clientProvider?.ClientOptions);
            }
            else
            {
                Assert.IsNotNull(clientProvider?.ClientOptions);
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

        [Test]
        public void ValidateQueryParamDiff()
        {
            MockHelpers.LoadMockPlugin();

            //protocol and convenience methods should have a different type for enum query parameters
            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(GetEnumQueryParamClient());
            Assert.IsNotNull(clientProvider);
            var methods = clientProvider.Methods;
            //4 methods, sync / async + protocol / convenience
            Assert.AreEqual(4, methods.Count);
            //two methods need to have the query parameter as an enum
            Assert.AreEqual(2, methods.Where(m => m.Signature.Parameters.Any(p => p.Name == "queryParam" && p.Type.Name == "InputEnum")).Count());
            //two methods need to have the query parameter as an string
            Assert.AreEqual(2, methods.Where(m => m.Signature.Parameters.Any(p => p.Name == "queryParam" && p.Type.IsFrameworkType && p.Type.FrameworkType == typeof(string))).Count());
        }

        [Test]
        public void ValidateQueryParamWriterDiff()
        {
            MockHelpers.LoadMockPlugin(
                createClientCore: (client) => new ValidateQueryParamDiffClientProvider(client));

            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(GetEnumQueryParamClient());

            TypeProviderWriter writer = new(clientProvider);
            var codeFile = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeFile.Content);
        }

        private static InputClient GetEnumQueryParamClient()
            => new InputClient(
                TestClientName,
                "TestClient description",
                [
                    new InputOperation(
                        "Operation",
                        null,
                        "Operation",
                        null,
                        "public",
                        [
                            new InputParameter(
                                "queryParam",
                                "queryParam",
                                "queryParam",
                                new InputEnumType(
                                    "InputEnum",
                                    "InputEnum",
                                    "public",
                                    null,
                                    "InputEnum",
                                    InputModelTypeUsage.Input,
                                    new InputPrimitiveType(InputPrimitiveTypeKind.String, "string", "string", null, null),
                                    [
                                        new InputEnumTypeValue("value1", "value1", "value1"),
                                        new InputEnumTypeValue("value2", "value2", "value2"),
                                    ],
                                    true),
                                RequestLocation.Query,
                                defaultValue: null,
                                InputOperationParameterKind.Method,
                                isRequired: false, false, false, false, false, false, false, null, null)
                        ],
                        [
                            new OperationResponse(
                                [200],
                                null,
                                BodyMediaType.None,
                                [],
                                false,
                                [])
                        ],
                        "GET",
                        BodyMediaType.None,
                        "/foo",
                        "/foo",
                        null,
                        null,
                        true,
                        null,
                        null,
                    true,
                    true,
                        "Operation")
                ],
                [],
                null);

        private class ValidateQueryParamDiffClientProvider : ClientProvider
        {
            public ValidateQueryParamDiffClientProvider(InputClient client)
                : base(client)
            {
            }

            protected override MethodProvider[] BuildMethods()
            {
                var method = base.BuildMethods().Where(m => m.Signature.Parameters.Any(p => p.Name == "queryParam" && p.Type.Name == "InputEnum" && !m.Signature.Name.EndsWith("Async"))).First();
                method.Update(xmlDocProvider: new XmlDocProvider()); // null out the docs
                return [method];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
            protected override PropertyProvider[] BuildProperties() => [];
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

        public static IEnumerable<TestCaseData> SubClientTestCases
        {
            get
            {
                yield return new TestCaseData(new InputClient(TestClientName, "TestClient description", [], [], null), true);
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
