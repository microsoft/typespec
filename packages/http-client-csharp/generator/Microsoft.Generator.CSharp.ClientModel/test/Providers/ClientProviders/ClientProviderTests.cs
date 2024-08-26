// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
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
    public class ClientProviderTests
    {
        private const string SubClientsCategory = "WithSubClients";
        private const string TestClientName = "TestClient";
        private static readonly InputClient _animalClient = new("animal", "AnimalClient description", [], [], TestClientName);
        private static readonly InputClient _dogClient = new("dog", "DogClient description", [], [], _animalClient.Name);
        private static readonly InputClient _huskyClient = new("husky", "HuskyClient description", [], [], _dogClient.Name);
        private static readonly InputModelType _spreadModel = InputFactory.Model(
            "spreadModel",
            usage: InputModelTypeUsage.Spread,
            properties:
            [
                InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true),
            ]);

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
        public void TestBuildFields(List<InputParameter> inputParameters, bool containsAdditionalOptionalParams)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
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
                Assert.AreEqual(4, fields.Count);
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

        [TestCase(true)]
        [TestCase(false)]
        public void TestGetClientOptions(bool isSubClient)
        {
            string? parentClientName = null;
            if (isSubClient)
            {
                parentClientName = "parent";
            }

            var client = InputFactory.Client(TestClientName, parent: parentClientName);
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

        [TestCaseSource(nameof(ValidateClientWithSpreadTestCases))]
        public void ValidateClientWithSpread(InputClient inputClient)
        {
            var clientProvider = new ClientProvider(inputClient);
            var methods = clientProvider.Methods;

            Assert.AreEqual(4, methods.Count);

            var protocolMethods = methods.Where(m => m.Signature.Parameters.Any(p => p.Type.Equals(typeof(BinaryContent)))).ToList();
            Assert.AreEqual(2, protocolMethods.Count);
            Assert.AreEqual(2, protocolMethods[0].Signature.Parameters.Count);
            Assert.AreEqual(2, protocolMethods[1].Signature.Parameters.Count);

            Assert.AreEqual(new CSharpType(typeof(BinaryContent)), protocolMethods[0].Signature.Parameters[0].Type);
            Assert.AreEqual(new CSharpType(typeof(RequestOptions)), protocolMethods[0].Signature.Parameters[1].Type);
            Assert.AreEqual(new CSharpType(typeof(BinaryContent)), protocolMethods[1].Signature.Parameters[0].Type);
            Assert.AreEqual(new CSharpType(typeof(RequestOptions)), protocolMethods[1].Signature.Parameters[1].Type);

            var convenienceMethods = methods.Where(m => m.Signature.Parameters.Any(p => p.Type.Equals(typeof(string)))).ToList();
            Assert.AreEqual(2, convenienceMethods.Count);
            Assert.AreEqual(1, convenienceMethods[0].Signature.Parameters.Count);

            Assert.AreEqual(new CSharpType(typeof(string)), convenienceMethods[0].Signature.Parameters[0].Type);
            Assert.AreEqual("p1", convenienceMethods[0].Signature.Parameters[0].Name);

        }

        private static InputClient GetEnumQueryParamClient()
            => InputFactory.Client(
                TestClientName,
                operations:
                [
                    InputFactory.Operation(
                        "Operation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "queryParam",
                                InputFactory.Enum(
                                    "InputEnum",
                                    InputPrimitiveType.String,
                                    usage: InputModelTypeUsage.Input,
                                    isExtensible: true,
                                    values:
                                    [
                                        InputFactory.EnumMember.String("value1", "value1"),
                                        InputFactory.EnumMember.String("value2", "value2")
                                    ]),
                                isRequired: true,
                                location: RequestLocation.Query)
                        ])
                ]);

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
                    InputFactory.Parameter(
                        "optionalParam",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client),
                    InputFactory.Parameter(
                        "optionalParam2",
                        InputPrimitiveType.String,
                        location: RequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client),
                    InputFactory.Parameter(
                        "optionalParam3",
                        InputPrimitiveType.Int64,
                        location: RequestLocation.None,
                        defaultValue: InputFactory.Constant.Int64(2),
                        kind: InputOperationParameterKind.Client),
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

        public static IEnumerable<TestCaseData> ValidateClientWithSpreadTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Client(
                    TestClientName,
                    operations:
                    [
                        InputFactory.Operation(
                        "CreateMessage",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "spread",
                                _spreadModel,
                                location: RequestLocation.Body,
                                isRequired: true,
                                kind: InputOperationParameterKind.Spread),
                        ])
                    ]));
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

        private static IEnumerable<TestCaseData> EndpointParamInitializationValueTestCases()
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
