// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
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
    public class ClientProviderAuthTests
    {
        private const string SubClientsCategory = "WithSubClients";
        private const string KeyAuthCategory = "KeyAuth";
        private const string OAuth2Category = "OAuth2";
        private const string TestClientName = "TestClient";
        private static readonly InputClient _animalClient = new("animal", "AnimalClient description", [], [], TestClientName);
        private static readonly InputClient _dogClient = new("dog", "DogClient description", [], [], _animalClient.Name);
        private static readonly InputClient _huskyClient = new("husky", "HuskyClient description", [], [], _dogClient.Name);

        private bool _containsSubClients;
        private bool _hasKeyAuth;
        private bool _hasOAuth2;
        private bool _hasAuth;

        [SetUp]
        public void SetUp()
        {
            var categories = TestContext.CurrentContext.Test?.Properties["Category"];
            _containsSubClients = categories?.Contains(SubClientsCategory) ?? false;
            _hasKeyAuth = categories?.Contains(KeyAuthCategory) ?? false;
            _hasOAuth2 = categories?.Contains(OAuth2Category) ?? false;
            _hasAuth = _hasKeyAuth || _hasOAuth2;

            Func<IReadOnlyList<InputClient>>? clients = _containsSubClients ?
                () => [_animalClient, _dogClient, _huskyClient] :
                null;
            Func<InputApiKeyAuth>? apiKeyAuth = _hasKeyAuth ? () => new InputApiKeyAuth("mock", null) : null;
            Func<InputOAuth2Auth>? oauth2Auth = _hasOAuth2 ? () => new InputOAuth2Auth(["mock"]) : null;
            MockHelpers.LoadMockPlugin(
                apiKeyAuth: apiKeyAuth,
                oauth2Auth: oauth2Auth,
                clients: clients,
                clientPipelineApi: TestClientPipelineApi.Instance);
        }

        [TestCaseSource(nameof(BuildFieldsTestCases), Category = KeyAuthCategory)]
        public void TestBuildFields_WithAuth(List<InputParameter> inputParameters)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            if (_hasKeyAuth)
            {
                // key auth should have the following fields: AuthorizationHeader, _keyCredential
                AssertHasFields(clientProvider, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string)), "AuthorizationHeader"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(ApiKeyCredential)), "_keyCredential")
                });
            }
            if (_hasOAuth2)
            {
                // oauth2 auth should have the following fields: AuthorizationScopes, _tokenCredential
                AssertHasFields(clientProvider, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential"),
                });
            }
        }

        [TestCaseSource(nameof(BuildFieldsTestCases))]
        public void TestBuildFields_NoAuth(List<InputParameter> inputParameters)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            // fields here should not have anything related with auth
            bool authFieldFound = false;
            foreach (var field in clientProvider.Fields)
            {
                if (field.Name.EndsWith("Credential") || field.Name.Contains("Authorization"))
                {
                    authFieldFound = true;
                }
            }

            Assert.IsFalse(authFieldFound);
        }

        // validates the credential fields are built correctly when a client has sub-clients
        [TestCaseSource(nameof(SubClientFieldsTestCases), Category = SubClientsCategory)]
        public void TestBuildFields_WithSubClients_NoAuth(InputClient client)
        {
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            // fields here should not have anything related with auth
            bool authFieldFound = false;
            foreach (var field in clientProvider.Fields)
            {
                if (field.Name.EndsWith("Credential") || field.Name.Contains("Authorization"))
                {
                    authFieldFound = true;
                }
            }

            Assert.IsFalse(authFieldFound);
        }

        // validates the credential fields are built correctly when a client has sub-clients
        [TestCaseSource(nameof(SubClientFieldsTestCases), Category = $"{SubClientsCategory},{KeyAuthCategory}")]
        [TestCaseSource(nameof(SubClientFieldsTestCases), Category = $"{SubClientsCategory},{OAuth2Category}")]
        [TestCaseSource(nameof(SubClientFieldsTestCases), Category = $"{SubClientsCategory},{KeyAuthCategory},{OAuth2Category}")]
        public void TestBuildFields_WithSubClients_WithAuth(InputClient client)
        {
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            if (_hasKeyAuth)
            {
                // key auth should have the following fields: AuthorizationHeader, _keyCredential
                AssertHasFields(clientProvider, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string)), "AuthorizationHeader"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(ApiKeyCredential)), "_keyCredential")
                });
            }
            if (_hasOAuth2)
            {
                // oauth2 auth should have the following fields: AuthorizationScopes, _tokenCredential
                AssertHasFields(clientProvider, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.Const, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(TestTokenCredential)), "_tokenCredential"),
                });
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = KeyAuthCategory)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = OAuth2Category)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = $"{KeyAuthCategory},{OAuth2Category}")]
        public void TestBuildConstructors_PrimaryConstructor(List<InputParameter> inputParameters)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            var primaryPublicConstructors = constructors.Where(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public).ToArray();

            // for no auth or one auth case, this should be 1
            // for both auth case, this should be 2
            var expectedPrimaryCtorCount = _hasKeyAuth && _hasOAuth2 ? 2 : 1;
            Assert.AreEqual(expectedPrimaryCtorCount, primaryPublicConstructors.Length);

            foreach (var primaryCtor in primaryPublicConstructors)
            {
                ValidatePrimaryConstructor(primaryCtor, inputParameters);
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = KeyAuthCategory)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = OAuth2Category)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = $"{KeyAuthCategory},{OAuth2Category}")]
        public void TestBuildConstructors_SecondaryConstructor(List<InputParameter> inputParameters)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            var primaryPublicConstructors = constructors.Where(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public).ToArray();
            var secondaryPublicConstructors = constructors.Where(
                c => c.Signature?.Initializer != null && c.Signature?.Modifiers == MethodSignatureModifiers.Public).ToArray();

            // for no auth or one auth case, this should be 1
            // for both auth case, this should be 2
            var expectedSecondaryCtorCount = _hasKeyAuth && _hasOAuth2 ? 2 : 1;
            Assert.AreEqual(expectedSecondaryCtorCount, secondaryPublicConstructors.Length);
            foreach (var secondaryPublicConstructor in secondaryPublicConstructors)
            {
                ValidateSecondaryConstructor(primaryPublicConstructors, secondaryPublicConstructor, inputParameters);
            }
        }

        [TestCase]
        public void TestBuildConstructors_ForSubClient_NoAuth()
        {
            var clientProvider = new ClientProvider(_animalClient);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            Assert.AreEqual(2, constructors.Count);
            var internalConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Internal);
            Assert.IsNotNull(internalConstructor);
            // in the no auth case, the ctor no longer has the credentail parameter therefore here we expect 2 parameters.
            var ctorParams = internalConstructor?.Signature?.Parameters;
            Assert.AreEqual(2, ctorParams?.Count);

            var mockingConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Protected);
            Assert.IsNotNull(mockingConstructor);
        }

        [TestCase(Category = KeyAuthCategory)]
        [TestCase(Category = OAuth2Category)]
        public void TestBuildConstructors_ForSubClient_KeyAuthOrOAuth2Auth()
        {
            var clientProvider = new ClientProvider(_animalClient);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            Assert.AreEqual(2, constructors.Count);
            var internalConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Internal);
            Assert.IsNotNull(internalConstructor);
            // when there is only one approach of auth, we have 3 parameters in the ctor.
            var ctorParams = internalConstructor?.Signature?.Parameters;
            Assert.AreEqual(3, ctorParams?.Count);

            var mockingConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Protected);
            Assert.IsNotNull(mockingConstructor);
        }

        [TestCase(Category = $"{KeyAuthCategory},{OAuth2Category}")]
        public void TestBuildConstructors_ForSubClient_BothAuth()
        {
            var clientProvider = new ClientProvider(_animalClient);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            Assert.AreEqual(2, constructors.Count);
            var internalConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Internal);
            Assert.IsNotNull(internalConstructor);
            // when we have both auths, we have 4 parameters in the ctor, because now we should have two credential parameters
            var ctorParams = internalConstructor?.Signature?.Parameters;
            Assert.AreEqual(4, ctorParams?.Count);

            var mockingConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Protected);
            Assert.IsNotNull(mockingConstructor);
        }

        private void ValidatePrimaryConstructor(
            ConstructorProvider primaryPublicConstructor,
            List<InputParameter> inputParameters)
        {
            var primaryCtorParams = primaryPublicConstructor?.Signature?.Parameters;
            // in no auth case, the ctor only have two parameters: endpoint and options
            // in other cases, the ctor should have three parameters: endpoint, credential, options
            // specifically, in both auth cases, we should have two ctors corresponding to each credential type as the second parameter
            var expectedPrimaryCtorParamCount = !_hasKeyAuth && !_hasOAuth2 ? 2 : 3;

            Assert.AreEqual(expectedPrimaryCtorParamCount, primaryCtorParams?.Count);

            // the first should be endpoint
            var endpointParam = primaryCtorParams?[0];
            Assert.AreEqual(KnownParameters.Endpoint.Name, endpointParam?.Name);

            if (endpointParam?.DefaultValue != null)
            {
                var inputEndpointParam = inputParameters.FirstOrDefault(p => p.IsEndpoint);
                var parsedValue = inputEndpointParam?.DefaultValue?.Value;
                Assert.AreEqual(Literal(parsedValue), endpointParam?.InitializationValue);
            }

            // the last parameter should be the options
            var optionsParam = primaryCtorParams?[^1];
            Assert.AreEqual("options", optionsParam?.Name);

            if (_hasAuth)
            {
                // when there is any auth, the second should be auth parameter
                var authParam = primaryCtorParams?[1];
                Assert.IsNotNull(authParam);
                if (authParam?.Name == "keyCredential")
                {
                    Assert.AreEqual(new CSharpType(typeof(ApiKeyCredential)), authParam?.Type);
                }
                else if (authParam?.Name == "tokenCredential")
                {
                    Assert.AreEqual(new CSharpType(typeof(TestTokenCredential)), authParam?.Type);
                }
                else
                {
                    Assert.Fail("Unexpected auth parameter");
                }
            }

            // validate the body of the primary ctor
            var primaryCtorBody = primaryPublicConstructor?.BodyStatements;
            Assert.IsNotNull(primaryCtorBody);
        }

        private void ValidateSecondaryConstructor(
            IReadOnlyList<ConstructorProvider> primaryConstructors,
            ConstructorProvider secondaryPublicConstructor,
            List<InputParameter> inputParameters)
        {
            var ctorParams = secondaryPublicConstructor.Signature?.Parameters;

            // secondary ctor should consist of all required parameters + auth parameter (when present)
            var requiredParams = inputParameters.Where(p => p.IsRequired).ToList();
            var authParameterCount = _hasAuth ? 1 : 0;
            Assert.AreEqual(requiredParams.Count + authParameterCount, ctorParams?.Count);
            var endpointParam = ctorParams?.FirstOrDefault(p => p.Name == KnownParameters.Endpoint.Name);

            if (requiredParams.Count == 0)
            {
                // auth should be the only parameter if endpoint is optional when there is auth
                if (_hasAuth)
                {
                    Assert.IsTrue(ctorParams?[0].Name.EndsWith("Credential"));
                }
                else
                {
                    // when there is no auth, the ctor should not have parameters
                    Assert.AreEqual(0, ctorParams?.Count);
                }
            }
            else
            {
                // otherwise, it should only consist of the auth parameter
                Assert.AreEqual(KnownParameters.Endpoint.Name, ctorParams?[0].Name);
                if (_hasAuth)
                {
                    Assert.IsTrue(ctorParams?[1].Name.EndsWith("Credential"));
                }
            }

            Assert.AreEqual(MethodBodyStatement.Empty, secondaryPublicConstructor?.BodyStatements);

            // validate the initializer
            var initializer = secondaryPublicConstructor?.Signature?.Initializer;
            Assert.NotNull(initializer);
            Assert.IsTrue(primaryConstructors.Any(pc => pc.Signature.Parameters.Count == initializer?.Arguments.Count));
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
                });
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
                });
            }
        }

        public static IEnumerable<TestCaseData> SubClientFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Client(TestClientName));
                yield return new TestCaseData(_animalClient);
                yield return new TestCaseData(_dogClient);
                yield return new TestCaseData(_huskyClient);
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

        // TODO -- this is temporary here before System.ClientModel officially supports OAuth2 auth
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

            public override CSharpType KeyCredentialType => typeof(ApiKeyCredential);

            public override CSharpType TokenCredentialType => typeof(TestTokenCredential);

            public override ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies)
                => Original.Invoke("GetFakeCreate", [options, perRetryPolicies]);

            public override ValueExpression CreateMessage(HttpRequestOptionsApi requestOptions, ValueExpression responseClassifier)
                => Original.Invoke("GetFakeCreateMessage", [requestOptions, responseClassifier]);

            public override ClientPipelineApi FromExpression(ValueExpression expression)
                => new TestClientPipelineApi(expression);

            public override ValueExpression ConsumeKeyAuth(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null)
                => Original.Invoke("GetFakeApiKeyAuthorizationPolicy", keyPrefix != null ? [credential, headerName, keyPrefix] : [credential, headerName]);

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
