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
using static Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders.ClientProviderTestsUtils;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderOAuth2AuthTests
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
                    oauth2Auth: () => new InputOAuth2Auth(["mock"]),
                    clients: () => [_animalClient, _dogClient, _huskyClient],
                    clientPipelineApi: TestClientPipelineApi.Instance);
            }
            else
            {
                MockHelpers.LoadMockPlugin(
                    oauth2Auth: () => new InputOAuth2Auth(["mock"]),
                    clientPipelineApi: TestClientPipelineApi.Instance);
            }
        }

        [TestCaseSource(nameof(BuildFieldsTestCases))]
        public void TestBuildFields(List<InputParameter> inputParameters, List<ExpectedFieldProvider> expectedFields)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            AssertClientFields(clientProvider, expectedFields);
        }

        // validates the fields are built correctly when a client has sub-clients
        [TestCaseSource(nameof(SubClientFieldsTestCases), Category = SubClientsCategory)]
        public void TestBuildFields_WithSubClients(InputClient client, List<ExpectedFieldProvider> expectedFields)
        {
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            AssertClientFields(clientProvider, expectedFields);
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
            Assert.AreEqual("tokenCredential", primaryCtorParams?[1].Name);
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
                Assert.AreEqual("tokenCredential", ctorParams?[0].Name);
            }
            else
            {
                // otherwise, it should only consist of the auth parameter
                Assert.AreEqual(KnownParameters.Endpoint.Name, ctorParams?[0].Name);
                Assert.AreEqual("tokenCredential", ctorParams?[1].Name);
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

        [TestCaseSource(nameof(SubClientFactoryMethodTestCases), Category = SubClientsCategory)]
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
                },
                new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(string), true), "_optionalParam")
                }
                );
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
                },
                new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(string), true), "_optionalNullableParam"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(string), false), "_requiredParam2"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(long), false), "_requiredParam3")
                });
            }
        }

        public static IEnumerable<TestCaseData> SubClientFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Client(TestClientName), new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential"),
                    new(FieldModifiers.Private, new ExpectedCSharpType("Animal", "Sample", true), "_cachedAnimal"),
                });
                yield return new TestCaseData(_animalClient, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential"),
                    new(FieldModifiers.Private, new ExpectedCSharpType("Dog", "Sample", true), "_cachedDog"),
                });
                yield return new TestCaseData(_dogClient, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential"),
                    new(FieldModifiers.Private, new ExpectedCSharpType("Husky", "Sample", true), "_cachedHusky"),
                });
                yield return new TestCaseData(_huskyClient, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential")
                });
            }
        }

        public static IEnumerable<TestCaseData> SubClientFactoryMethodTestCases
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

        private record TestClientPipelineApi : ClientPipelineApi
        {
            private static ClientPipelineApi? _instance;
            internal static ClientPipelineApi Instance => _instance ??= new TestClientPipelineApi(Empty);

            public TestClientPipelineApi(ValueExpression original) : base(typeof(string), original)
            {
            }

            public override CSharpType ClientPipelineType => typeof(string);

            public override CSharpType ClientPipelineOptionsType => typeof(string);

            public override CSharpType PipelinePolicyType => typeof(string);

            public override CSharpType? KeyCredentialType => null;

            public override CSharpType TokenCredentialType => typeof(TestTokenCredential);

            public override ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies)
                => Original.Invoke("GetFakeCreate", [options, perRetryPolicies]);

            public override ValueExpression CreateMessage(HttpRequestOptionsApi requestOptions, ValueExpression responseClassifier)
                => Original.Invoke("GetFakeCreateMessage", [requestOptions, responseClassifier]);

            public override ClientPipelineApi FromExpression(ValueExpression expression)
                => new TestClientPipelineApi(expression);

            public override ValueExpression ConsumeKeyAuth(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null)
                => throw new InvalidOperationException("ApiKey is not supported in this test");

            public override ValueExpression ConsumeOAuth2Auth(ValueExpression credential, ValueExpression scopes)
                => Original.Invoke("GetFakeTokenAuthorizationPolicy", [credential, scopes]);

            public override ClientPipelineApi ToExpression() => this;

            public override MethodBodyStatement[] ProcessMessage(HttpMessageApi message, HttpRequestOptionsApi options)
                => [Original.Invoke("GetFakeProcessMessage", [message, options]).Terminate()];

            public override MethodBodyStatement[] ProcessMessageAsync(HttpMessageApi message, HttpRequestOptionsApi options)
                => [Original.Invoke("GetFakeProcessMessageAsync", [message, options]).Terminate()];
        }

        internal class TestTokenCredential { }
    }
}
