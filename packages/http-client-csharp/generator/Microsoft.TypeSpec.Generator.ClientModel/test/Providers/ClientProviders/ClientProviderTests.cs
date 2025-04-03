// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderTests
    {
        private const string SubClientsCategory = "WithSubClients";
        private const string KeyAuthCategory = "WithKeyAuth";
        private const string OAuth2Category = "WithOAuth2";
        private const string OnlyUnsupportedAuthCategory = "WithOnlyUnsupportedAuth";
        private const string TestClientName = "TestClient";
        private static readonly InputClient _testClient = InputFactory.Client(TestClientName);
        private static readonly InputClient _animalClient = InputFactory.Client("animal", doc: "AnimalClient description", parent: _testClient);
        private static readonly InputClient _dogClient = InputFactory.Client("dog", doc: "DogClient description", parent: _animalClient);
        private static readonly InputClient _huskyClient = InputFactory.Client("husky", doc: "HuskyClient description", parent: _dogClient);
        private static readonly InputModelType _spreadModel = InputFactory.Model(
            "spreadModel",
            usage: InputModelTypeUsage.Spread,
            properties:
            [
                InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true),
            ]);

        private bool _containsSubClients;
        private bool _hasKeyAuth;
        private bool _hasOAuth2;
        private bool _hasSupportedAuth;
        private bool _hasOnlyUnsupportedAuth;

        [SetUp]
        public void SetUp()
        {
            var categories = TestContext.CurrentContext.Test?.Properties["Category"];
            _containsSubClients = categories?.Contains(SubClientsCategory) ?? false;
            _hasKeyAuth = categories?.Contains(KeyAuthCategory) ?? false;
            _hasOAuth2 = categories?.Contains(OAuth2Category) ?? false;
            _hasSupportedAuth = _hasKeyAuth || _hasOAuth2;
            _hasOnlyUnsupportedAuth = categories?.Contains(OnlyUnsupportedAuthCategory) ?? false;

            Func<IReadOnlyList<InputClient>>? clients = _containsSubClients ?
                () => [_testClient] :
                null;
            InputApiKeyAuth? apiKeyAuth = _hasKeyAuth ? new InputApiKeyAuth("mock", null) : null;
            InputOAuth2Auth? oauth2Auth = _hasOAuth2 ? new InputOAuth2Auth(["mock"]) : null;
            Func<InputAuth>? auth = (_hasSupportedAuth || _hasOnlyUnsupportedAuth)
                ? () => new InputAuth(apiKeyAuth, oauth2Auth)
                : null;

            MockHelpers.LoadMockGenerator(
                clients: clients,
                clientPipelineApi: TestClientPipelineApi.Instance,
                auth: auth);
        }

        [Test]
        public void TestNullRootClientWithChildren()
        {
            var plugin = MockHelpers.LoadMockGenerator(
                clients: () => [_testClient],
                clientPipelineApi: TestClientPipelineApi.Instance,
                createClientCore: FilterOutClient
                );

            ClientProvider? FilterOutClient(InputClient client)
            {
                if (client == _testClient)
                {
                    return null;
                }
                return new ClientProvider(client);
            }

            var clients = plugin.Object.OutputLibrary.TypeProviders.Where(p => p is ClientProvider).ToList();
            Assert.AreEqual(3, clients.Count);
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
        public void TestBuildFields(List<InputParameter> inputParameters, List<ExpectedFieldProvider> expectedFields)
        {
            var client = InputFactory.Client(TestClientName, parameters: [.. inputParameters]);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            AssertHasFields(clientProvider, expectedFields);
        }

        [TestCaseSource(nameof(BuildAuthFieldsTestCases), Category = KeyAuthCategory)]
        [TestCaseSource(nameof(BuildAuthFieldsTestCases), Category = OAuth2Category)]
        [TestCaseSource(nameof(BuildAuthFieldsTestCases), Category = $"{KeyAuthCategory},{OAuth2Category}")]
        [TestCaseSource(nameof(BuildAuthFieldsTestCases), Category = OnlyUnsupportedAuthCategory)]
        public void TestBuildAuthFields_WithAuth(List<InputParameter> inputParameters)
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
                    new(FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(FakeTokenCredential)), "_tokenCredential"),
                });
            }

            if (_hasOnlyUnsupportedAuth)
            {
                Assert.IsFalse(clientProvider.Fields.Any(f => f.Name.Contains("credential", StringComparison.OrdinalIgnoreCase)));
                Assert.IsFalse(clientProvider.Fields.Any(f => f.Name.Contains("auth", StringComparison.OrdinalIgnoreCase)));
            }
        }

        [TestCaseSource(nameof(BuildAuthFieldsTestCases))]
        public void TestBuildAuthFields_NoAuth(List<InputParameter> inputParameters)
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

        // validates the fields are built correctly when a client has sub-clients
        [TestCaseSource(nameof(SubClientFieldsTestCases), Category = SubClientsCategory)]
        public void TestBuildFields_WithSubClients(InputClient client, List<ExpectedFieldProvider> expectedFields)
        {
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            AssertHasFields(clientProvider, expectedFields);
        }

        // validates the credential fields do not exist within sub-clients
        [TestCaseSource(nameof(SubClientAuthFieldsTestCases), Category = SubClientsCategory)]
        [TestCaseSource(nameof(SubClientAuthFieldsTestCases), Category = OnlyUnsupportedAuthCategory)]
        public void TestBuildAuthFields_WithSubClients_NoAuth(InputClient client)
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
        [TestCaseSource(nameof(WithSubClientAuthFieldsTestCases), Category = $"{SubClientsCategory},{KeyAuthCategory}")]
        [TestCaseSource(nameof(WithSubClientAuthFieldsTestCases), Category = $"{SubClientsCategory},{OAuth2Category}")]
        [TestCaseSource(nameof(WithSubClientAuthFieldsTestCases), Category = $"{SubClientsCategory},{KeyAuthCategory},{OAuth2Category}")]
        public void TestBuildAuthFields_WithSubClients_WithAuth(InputClient client)
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
                    new(FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly, new CSharpType(typeof(string[])), "AuthorizationScopes"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(FakeTokenCredential)), "_tokenCredential"),
                });
            }
        }

        // validates the credential fields do not exist within sub-clients
        [TestCaseSource(nameof(SubClientAuthFieldsTestCases), Category = $"{SubClientsCategory},{KeyAuthCategory}")]
        [TestCaseSource(nameof(SubClientAuthFieldsTestCases), Category = $"{SubClientsCategory},{OAuth2Category}")]
        [TestCaseSource(nameof(SubClientAuthFieldsTestCases), Category = $"{SubClientsCategory},{KeyAuthCategory},{OAuth2Category}")]
        [TestCaseSource(nameof(SubClientAuthFieldsTestCases), Category = OnlyUnsupportedAuthCategory)]
        public void TestBuildAuthFields_SubClients_WithAuth(InputClient client)
        {
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            if (_hasKeyAuth)
            {
                Assert.IsFalse(clientProvider.Fields.Any(f => f.Name.Equals("_keyCredential")));
            }
            if (_hasOAuth2)
            {
                Assert.IsFalse(clientProvider.Fields.Any(f => f.Name.Equals("_tokenCredential")));
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = KeyAuthCategory)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = OAuth2Category)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = $"{KeyAuthCategory},{OAuth2Category}")]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = OnlyUnsupportedAuthCategory)]
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
            // for only unsupported auth case, this should be 0
            int expectedPrimaryCtorCount;
            if (_hasOnlyUnsupportedAuth)
            {
                expectedPrimaryCtorCount = 0;
            }
            else
            {
                expectedPrimaryCtorCount = _hasKeyAuth && _hasOAuth2 ? 2 : 1;
            }
            Assert.AreEqual(expectedPrimaryCtorCount, primaryPublicConstructors.Length);

            for (int i = 0; i < primaryPublicConstructors.Length; i++)
            {
                ValidatePrimaryConstructor(primaryPublicConstructors[i], inputParameters, i);
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = KeyAuthCategory)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = OAuth2Category)]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = $"{KeyAuthCategory},{OAuth2Category}")]
        [TestCaseSource(nameof(BuildConstructorsTestCases), Category = OnlyUnsupportedAuthCategory)]
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
            // for only unsupported auth case, this should be 0
            int expectedSecondaryCtorCount;
            if (_hasOnlyUnsupportedAuth)
            {
                expectedSecondaryCtorCount = 0;
            }
            else
            {
                expectedSecondaryCtorCount = _hasKeyAuth && _hasOAuth2 ? 2 : 1;
            }

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
            // when there is only one approach of auth, we still have 2 parameters in the ctor because we should not have auth parameter in sub-client
            var ctorParams = internalConstructor?.Signature?.Parameters;
            Assert.AreEqual(2, ctorParams?.Count);

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
            // when we have both auths, we still have 2 parameters in the ctor, because we should not have auth parameters in sub-client
            var ctorParams = internalConstructor?.Signature?.Parameters;
            Assert.AreEqual(2, ctorParams?.Count);

            var mockingConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Modifiers == MethodSignatureModifiers.Protected);
            Assert.IsNotNull(mockingConstructor);
        }

        private void ValidatePrimaryConstructor(
            ConstructorProvider primaryPublicConstructor,
            List<InputParameter> inputParameters,
            int ctorIndex,
            [CallerMemberName] string method = "",
            [CallerFilePath] string filePath = "")
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

            if (_hasSupportedAuth)
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
                    Assert.AreEqual(new CSharpType(typeof(FakeTokenCredential)), authParam?.Type);
                }
                else
                {
                    Assert.Fail("Unexpected auth parameter");
                }
            }

            // validate the body of the primary ctor
            var caseName = TestContext.CurrentContext.Test.Properties.Get("caseName");
            var expected = Helpers.GetExpectedFromFile($"{caseName},{_hasKeyAuth},{_hasOAuth2},{ctorIndex}", method, filePath);
            var primaryCtorBody = primaryPublicConstructor?.BodyStatements;
            Assert.IsNotNull(primaryCtorBody);
            Assert.AreEqual(expected, primaryCtorBody?.ToDisplayString());
        }

        private void ValidateSecondaryConstructor(
            IReadOnlyList<ConstructorProvider> primaryConstructors,
            ConstructorProvider secondaryPublicConstructor,
            List<InputParameter> inputParameters)
        {
            var ctorParams = secondaryPublicConstructor.Signature?.Parameters;

            // secondary ctor should consist of all required parameters + auth parameter (when present)
            var requiredParams = inputParameters.Where(p => p.IsRequired).ToList();
            var authParameterCount = _hasSupportedAuth ? 1 : 0;
            Assert.AreEqual(requiredParams.Count + authParameterCount, ctorParams?.Count);
            var endpointParam = ctorParams?.FirstOrDefault(p => p.Name == KnownParameters.Endpoint.Name);

            if (requiredParams.Count == 0)
            {
                // auth should be the only parameter if endpoint is optional when there is auth
                if (_hasSupportedAuth)
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
                if (_hasSupportedAuth)
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

        [TestCase(true)]
        [TestCase(false)]
        public void TestGetClientOptions(bool isSubClient)
        {
            InputClient? parentClient = null;
            if (isSubClient)
            {
                parentClient = InputFactory.Client("parent");
            }

            var client = InputFactory.Client(TestClientName, parent: parentClient);
            var clientProvider = new ClientProvider(client);
            Assert.IsNotNull(clientProvider);

            if (isSubClient)
            {
                Assert.IsNull(clientProvider.ClientOptions.Value);
            }
            else
            {
                Assert.IsNotNull(clientProvider.ClientOptions.Value);
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

        [Test]
        public void ValidateQueryParamDiff()
        {
            MockHelpers.LoadMockGenerator();

            //protocol and convenience methods should have a different type for enum query parameters
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(GetEnumQueryParamClient());
            Assert.IsNotNull(clientProvider);
            var methods = clientProvider!.Methods;
            //4 methods, sync / async + protocol / convenience
            Assert.AreEqual(4, methods.Count);
            //two methods need to have the query parameter as an enum
            Assert.AreEqual(2, methods.Where(m => m.Signature.Parameters.Any(p => p.Name == "queryParam" && p.Type.Name == "InputEnum")).Count());
            //two methods need to have the query parameter as an string
            Assert.AreEqual(2, methods.Where(m => m.Signature.Parameters.Any(p => p.Name == "queryParam" && p.Type.IsFrameworkType && p.Type.FrameworkType == typeof(string))).Count());
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateQueryParamWriterDiff(bool isAsync)
        {
            MockHelpers.LoadMockGenerator(
                createClientCore: (client) => new ValidateQueryParamDiffClientProvider(client, isAsync));

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(GetEnumQueryParamClient());
            Assert.IsNotNull(clientProvider);

            TypeProviderWriter writer = new(clientProvider!);
            var codeFile = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(isAsync.ToString()), codeFile.Content);
        }

        // This test validates that no public constructors are generated when the client has only unsupported auth
        [Test]
        public void ValidateConstructorsWhenUnsupportedAuth()
        {
            MockHelpers.LoadMockGenerator(
                createClientCore: (client) => new UnsupportedAuthClientProvider(client),
                auth: () => new InputAuth(null, null));

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(InputFactory.Client(TestClientName));
            Assert.IsNotNull(clientProvider);

            TypeProviderWriter writer = new(clientProvider!);
            var codeFile = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), codeFile.Content);
        }

        [Test]
        public void ValidateMethodSignatureUsesIEnumerable()
        {
            MockHelpers.LoadMockGenerator();

            var inputClient = InputFactory.Client(
                TestClientName,
                operations:
                [
                    InputFactory.Operation(
                        "Foo",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "arrayParam",
                                InputFactory.Array(
                                    InputPrimitiveType.String))
                        ])
                ]);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);
            var convenienceMethod = clientProvider!.Methods.FirstOrDefault(
                m => m.Signature.Name == "Foo" &&
                     !m.Signature.Parameters.Any(p => p.Type.Equals(typeof(RequestOptions))));
            Assert.IsNotNull(convenienceMethod);
            Assert.AreEqual(new CSharpType(typeof(IEnumerable<string>)), convenienceMethod!.Signature.Parameters[0].Type);
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
            Assert.AreEqual(new CSharpType(typeof(RequestOptions), true), protocolMethods[0].Signature.Parameters[1].Type);
            Assert.AreEqual(new CSharpType(typeof(BinaryContent)), protocolMethods[1].Signature.Parameters[0].Type);
            Assert.AreEqual(new CSharpType(typeof(RequestOptions), true), protocolMethods[1].Signature.Parameters[1].Type);

            var convenienceMethods = methods.Where(m => m.Signature.Parameters.Any(p => p.Type.Equals(typeof(string)))).ToList();
            Assert.AreEqual(2, convenienceMethods.Count);
            Assert.AreEqual(2, convenienceMethods[0].Signature.Parameters.Count);

            Assert.AreEqual(new CSharpType(typeof(string)), convenienceMethods[0].Signature.Parameters[0].Type);
            Assert.AreEqual("p1", convenienceMethods[0].Signature.Parameters[0].Name);
        }

        [TestCaseSource(nameof(RequestOptionsParameterInSignatureTestCases))]
        public void TestRequestOptionsParameterInSignature(InputOperation inputOperation, bool shouldBeOptional, bool hasOptionalParameter)
        {
            var client = InputFactory.Client(TestClientName, operations: [inputOperation]);
            var clientProvider = new ClientProvider(client);
            var protocolMethods = clientProvider.Methods.Where(m => m.Signature.Parameters.Any(p => p.Type.Name == "RequestOptions")).ToList();
            var syncMethod = protocolMethods.FirstOrDefault(m => !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));
            Assert.IsNotNull(syncMethod);

            var requestOptionsParameterInSyncMethod = syncMethod!.Signature.Parameters.FirstOrDefault(p => p.Type.Name == "RequestOptions");
            Assert.IsNotNull(requestOptionsParameterInSyncMethod);
            Assert.AreEqual(shouldBeOptional, requestOptionsParameterInSyncMethod!.Type.IsNullable);

            var asyncMethod = protocolMethods.FirstOrDefault(m => m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));
            Assert.IsNotNull(asyncMethod);

            var requestOptionsParameterInAsyncMethod = asyncMethod!.Signature.Parameters.FirstOrDefault(p => p.Type.Name == "RequestOptions");
            Assert.IsNotNull(requestOptionsParameterInAsyncMethod);
            Assert.AreEqual(shouldBeOptional, requestOptionsParameterInAsyncMethod!.Type.IsNullable);

            // request options should always be last parameter
            Assert.AreEqual("RequestOptions", syncMethod.Signature.Parameters[^1].Type.Name);
            Assert.AreEqual("RequestOptions", asyncMethod.Signature.Parameters[^1].Type.Name);

            if (shouldBeOptional)
            {
                Assert.IsNotNull(requestOptionsParameterInSyncMethod.DefaultValue);
                Assert.IsNotNull(requestOptionsParameterInAsyncMethod.DefaultValue);
            }

            if (shouldBeOptional && hasOptionalParameter)
            {
                var optionalParameter = syncMethod.Signature.Parameters[^2];
                // The optional parameter should be required in protocol method
                Assert.IsNull(optionalParameter.DefaultValue);
                // It should also be nullable for value types
                if (optionalParameter.Type.IsValueType)
                {
                    Assert.IsTrue(optionalParameter.Type.IsNullable);
                }
            }
        }

        [Test]
        public void TestApiVersionOfClient()
        {
            List<string> apiVersions = ["1.0", "2.0"];
            var enumValues = apiVersions.Select(a => InputFactory.EnumMember.String(a, a));
            var inputEnum = InputFactory.Enum("ServiceVersion", InputPrimitiveType.Int64, values: [.. enumValues], usage: InputModelTypeUsage.ApiVersionEnum);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => apiVersions,
                inputEnums: () => [inputEnum]);
            var client = InputFactory.Client(TestClientName,
                operations: [
                    InputFactory.Operation("OperationWithApiVersion",
                            parameters: [InputFactory.Parameter("apiVersion", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query, kind: InputOperationParameterKind.Client, isApiVersion: true)])
                    ]);
            var clientProvider = new ClientProvider(client);
            Assert.IsNotNull(clientProvider);

            /* verify that the client has apiVersion field */
            Assert.IsNotNull(clientProvider.Fields.FirstOrDefault(f => f.Name.Equals("_apiVersion")));

            /* verify that there is no apiVersion parameter in constructor. */
            var apiVersionParameter = clientProvider.Constructors.Select(c => c.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion"))).FirstOrDefault();
            Assert.IsNull(apiVersionParameter);

            /* verify the apiVersion assignment in constructor body */
            var primaryConstructor = clientProvider.Constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            Assert.IsNotNull(primaryConstructor);
            var bodyStatements = primaryConstructor?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements);
            Assert.IsTrue(bodyStatements!.Statements.Any(s => s.ToDisplayString().IndexOf("_apiVersion = options.Version;\n") != -1));

            var method = clientProvider.Methods.FirstOrDefault(m => m.Signature.Name.Equals("OperationWithApiVersion"));
            Assert.IsNotNull(method);
            /* verify that the method does not have apiVersion parameter */
            Assert.IsNull(method?.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion")));
        }

        [TestCaseSource(nameof(ValidateApiVersionPathParameterTestCases))]
        public void TestApiVersionPathParameterOfClient(InputClient inputClient)
        {
            List<string> apiVersions = ["value1", "value2"];
            var enumValues = apiVersions.Select(a => InputFactory.EnumMember.String(a, a));
            var inputEnum = InputFactory.Enum("ServiceVersion", InputPrimitiveType.Int64, values: [.. enumValues], usage: InputModelTypeUsage.ApiVersionEnum);
            MockHelpers.LoadMockGenerator(
                apiVersions: () => apiVersions,
                inputEnums: () => [inputEnum]);

            var clientProvider = new ClientProvider(inputClient);
            Assert.IsNotNull(clientProvider);

            /* verify that the client has apiVersion field */
            var apiVersionField = clientProvider.Fields.FirstOrDefault(f => f.Name.Equals("_apiVersion"));
            Assert.IsNotNull(apiVersionField);
            Assert.AreEqual(new CSharpType(typeof(string)), apiVersionField?.Type);

            /* verify that there is no apiVersion parameter in constructor. */
            var apiVersionParameter = clientProvider.Constructors.Select(c => c.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion"))).FirstOrDefault();
            Assert.IsNull(apiVersionParameter);

            /* verify the apiVersion assignment in constructor body */
            var primaryConstructor = clientProvider.Constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            Assert.IsNotNull(primaryConstructor);
            var bodyStatements = primaryConstructor?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements);
            Assert.IsTrue(bodyStatements!.Statements.Any(s => s.ToDisplayString().IndexOf("_apiVersion = options.Version;\n") != -1));

            var method = clientProvider.Methods.FirstOrDefault(m => m.Signature.Name.Equals("TestOperation"));
            Assert.IsNotNull(method);
            /* verify that the method does not have apiVersion parameter */
            Assert.IsNull(method?.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion")));
        }

        [TestCase]
        public void ClientProviderIsAddedToLibrary()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                clients: () => [InputFactory.Client("test", clientNamespace: "test", doc: "test")]);

            Assert.AreEqual(1, mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ClientProvider>().Count());
        }

        [TestCase]
        public void NullClientProviderIsNotAddedToLibrary()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                clients: () => [InputFactory.Client("test", clientNamespace: "test", doc: "test")],
                createClientCore: (client) => null);

            Assert.IsEmpty(mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ClientProvider>());
        }

        [TestCase]
        public void ClientProviderSummaryIsPopulated()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                clients: () => [InputFactory.Client("test", clientNamespace: "test", doc: "client description")]);

            var client = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ClientProvider>().SingleOrDefault();
            Assert.IsNotNull(client);

            Assert.AreEqual("/// <summary> client description. </summary>\n", client!.XmlDocs.Summary!.ToDisplayString());
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
                                location: InputRequestLocation.Query)
                        ])
                ]);

        private class ValidateQueryParamDiffClientProvider : ClientProvider
        {
            private readonly bool _isAsync;

            public ValidateQueryParamDiffClientProvider(InputClient client, bool isAsync = false)
                : base(client)
            {
                _isAsync = isAsync;
            }

            protected override MethodProvider[] BuildMethods()
            {
                var method = base.BuildMethods().First(m => m.Signature.Parameters.Any(p =>
                    p is { Name: "queryParam", Type.Name: "InputEnum" } &&
                    ((_isAsync && m.Signature.Name.EndsWith("Async")) || (!_isAsync && !m.Signature.Name.EndsWith("Async")))));
                method.Update(xmlDocProvider: new XmlDocProvider()); // null out the docs
                return [method];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
            protected override PropertyProvider[] BuildProperties() => [];
        }

        private class UnsupportedAuthClientProvider : ClientProvider
        {
            public UnsupportedAuthClientProvider(InputClient client)
                : base(client) { }

            protected override MethodProvider[] BuildMethods() => [];

            protected override FieldProvider[] BuildFields() => [];
            protected override PropertyProvider[] BuildProperties() => [];
        }

        public static IEnumerable<TestCaseData> BuildAuthFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(new List<InputParameter>
                {
                    InputFactory.Parameter(
                        "optionalParam",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location:InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                });
                yield return new TestCaseData(new List<InputParameter>
                {
                    // have to explicitly set isRequired because we now call CreateParameter in buildFields
                    InputFactory.Parameter(
                        "optionalNullableParam",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isRequired: false),
                    InputFactory.Parameter(
                        "requiredParam2",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isRequired: true),
                    InputFactory.Parameter(
                        "requiredParam3",
                        InputPrimitiveType.Int64,
                        location: InputRequestLocation.None,
                        defaultValue: InputFactory.Constant.Int64(2),
                        kind: InputOperationParameterKind.Client,
                        isRequired: true),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        defaultValue: null,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                });
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
                        location: InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location:InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                },
                new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(string), true), "_optionalParam")
                }
                );
                yield return new TestCaseData(new List<InputParameter>
                {
                    // have to explicitly set isRequired because we now call CreateParameter in buildFields
                    InputFactory.Parameter(
                        "optionalNullableParam",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isRequired: false),
                    InputFactory.Parameter(
                        "requiredParam2",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isRequired: true),
                    InputFactory.Parameter(
                        "requiredParam3",
                        InputPrimitiveType.Int64,
                        location: InputRequestLocation.None,
                        defaultValue: InputFactory.Constant.Int64(2),
                        kind: InputOperationParameterKind.Client,
                        isRequired: true),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        defaultValue: null,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                },
                new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(string), true), "_optionalNullableParam"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(string), false), "_requiredParam2"),
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(long), false), "_requiredParam3")
                });
            }
        }

        public static IEnumerable<TestCaseData> WithSubClientAuthFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Client(TestClientName));
            }
        }

        public static IEnumerable<TestCaseData> SubClientAuthFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(_animalClient);
                yield return new TestCaseData(_dogClient);
                yield return new TestCaseData(_huskyClient);
            }
        }

        public static IEnumerable<TestCaseData> SubClientFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(_testClient, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private, new ExpectedCSharpType("Animal", "Sample", false), "_cachedAnimal"),
                });
                yield return new TestCaseData(_animalClient, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private, new ExpectedCSharpType("Dog", "Sample", false), "_cachedDog"),
                });
                yield return new TestCaseData(_dogClient, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint"),
                    new(FieldModifiers.Private, new ExpectedCSharpType("Husky", "Sample", false), "_cachedHusky"),
                });
                yield return new TestCaseData(_huskyClient, new List<ExpectedFieldProvider>
                {
                    new(FieldModifiers.Private | FieldModifiers.ReadOnly, new CSharpType(typeof(Uri)), "_endpoint")
                });
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
                                location: InputRequestLocation.Body,
                                isRequired: true,
                                kind: InputOperationParameterKind.Spread),
                        ])
                    ]));
            }
        }

        public static IEnumerable<TestCaseData> SubClientFactoryMethodTestCases
        {
            get
            {
                yield return new TestCaseData(_testClient, true);
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
                        location: InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client),
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        defaultValue: InputFactory.Constant.String("someValue"),
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true)
                }).SetProperty("caseName", "WithDefault");
                // scenario where endpoint is required
                yield return new TestCaseData(new List<InputParameter>
                {
                    InputFactory.Parameter(
                        KnownParameters.Endpoint.Name,
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client,
                        isRequired: true,
                        isEndpoint: true),
                    InputFactory.Parameter(
                        "optionalParam",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client)
                }).SetProperty("caseName", "WithRequired");
            }
        }

        public static IEnumerable<TestCaseData> RequestOptionsParameterInSignatureTestCases
        {
            get
            {
                // Protocol & convenience methods will have the same parameters, so RequestOptions should be required.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: InputRequestLocation.None,
                                isRequired: true),
                            InputFactory.Parameter(
                                "p2",
                                InputPrimitiveType.Int64,
                                location: InputRequestLocation.None,
                                isRequired: true),
                        ]), false, false);

                // Protocol & convenience methods will have the same parameters.
                // One of the parameter is optional, so it should be made required in the protocol method.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: InputRequestLocation.None,
                                isRequired: false),
                            InputFactory.Parameter(
                                "p2",
                                InputPrimitiveType.Int64,
                                location: InputRequestLocation.None,
                                isRequired: true),
                        ]), false, true);

                // Protocol & convenience methods will have the same parameters.
                // One of the parameter is optional value type, so it should be made nullable required in the protocol method, and RequestOptions can be optional.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.Int32,
                                location: InputRequestLocation.None,
                                isRequired: false),
                            InputFactory.Parameter(
                                "p2",
                                InputPrimitiveType.Int64,
                                location: InputRequestLocation.None,
                                isRequired: true),
                        ]), false, true);

                // convenience method only has a body param, so RequestOptions should be optional in protocol method.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                             InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: InputRequestLocation.Body),
                        ]), true, false);

                // Protocol & convenience methods will have different parameters since there is a model body param, so RequestOptions should be optional.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: InputRequestLocation.None,
                                isRequired: true),
                            InputFactory.Parameter(
                                "p2",
                                InputFactory.Model("SampleModel"),
                                location: InputRequestLocation.Body,
                                isRequired: true),
                        ]), true, false);

                // Protocol & convenience methods will have different parameters since there is a model body param, so RequestOptions should be optional.
                // One parameter is optional
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: InputRequestLocation.None,
                                isRequired: true),
                            InputFactory.Parameter(
                                "p2",
                                InputFactory.Model("SampleModel"),
                                location: InputRequestLocation.Body,
                                isRequired: false),
                        ]), true, true);

                // Convenience method has no parameters, RequestOptions should be required in protocol method.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        responses: [InputFactory.OperationResponse([201], InputFactory.Model("testModel"))],
                        parameters: []),
                    false, false);
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
                        location: InputRequestLocation.None,
                        kind: InputOperationParameterKind.Client,
                        isEndpoint: true,
                        defaultValue: InputFactory.Constant.String("mockValue")),
                    New.Instance(KnownParameters.Endpoint.Type, Literal("mockvalue")));
            }
        }

        private static IEnumerable<TestCaseData> ValidateApiVersionPathParameterTestCases
        {
            get
            {
                InputParameter endpointParameter = InputFactory.Parameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Uri,
                    isRequired: true,
                    kind: InputOperationParameterKind.Client,
                    isEndpoint: true,
                    isApiVersion: false);

                InputParameter stringApiVersionParameter = InputFactory.Parameter(
                    "apiVersion",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Uri,
                    isRequired: true,
                    kind: InputOperationParameterKind.Client,
                    isApiVersion: true);

                InputParameter enumApiVersionParameter = InputFactory.Parameter(
                    "apiVersion",
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
                    location: InputRequestLocation.Uri,
                    isRequired: true,
                    kind: InputOperationParameterKind.Client,
                    isApiVersion: true);

                yield return new TestCaseData(
                    InputFactory.Client(
                        "TestClient",
                        operations:
                        [
                            InputFactory.Operation(
                            "TestOperation",
                            uri: "{endpoint}/{apiVersion}")
                        ],
                        parameters: [
                            endpointParameter,
                        stringApiVersionParameter
                        ]));

                yield return new TestCaseData(
                    InputFactory.Client(
                        "TestClient",
                        operations:
                        [
                            InputFactory.Operation(
                        "TestOperation",
                        uri: "{endpoint}/{apiVersion}")
                        ],
                        parameters: [
                            endpointParameter,
                        enumApiVersionParameter
                        ]));
            }
        }

        // TODO -- this is temporary here before System.ClientModel officially supports OAuth2 auth
        private record TestClientPipelineApi : ClientPipelineProvider
        {
            private static ClientPipelineApi? _instance;
            internal new static ClientPipelineApi Instance => _instance ??= new TestClientPipelineApi(Empty);

            public TestClientPipelineApi(ValueExpression original) : base(original)
            {
            }

            public override CSharpType TokenCredentialType => typeof(FakeTokenCredential);

            public override ClientPipelineApi FromExpression(ValueExpression expression)
                => new TestClientPipelineApi(expression);

            public override ValueExpression TokenAuthorizationPolicy(ValueExpression credential, ValueExpression scopes)
                => Original.Invoke("GetFakeTokenAuthorizationPolicy", [credential, scopes]);

            public override ClientPipelineApi ToExpression() => this;
        }

        internal class FakeTokenCredential { }

        public record ExpectedCSharpType
        {
            public string Name { get; }

            public string Namespace { get; }

            public bool IsFrameworkType { get; }

            public Type FrameworkType => _frameworkType ?? throw new InvalidOperationException();

            public bool IsNullable { get; }

            private readonly Type? _frameworkType;

            public ExpectedCSharpType(Type frameworkType, bool isNullable)
            {
                _frameworkType = frameworkType;
                IsFrameworkType = true;
                IsNullable = isNullable;
                Name = frameworkType.Name;
                Namespace = frameworkType.Namespace!;
            }

            public ExpectedCSharpType(string name, string ns, bool isNullable)
            {
                IsFrameworkType = false;
                IsNullable = isNullable;
                Name = name;
                Namespace = ns;
            }

            public static implicit operator ExpectedCSharpType(CSharpType type)
            {
                if (type.IsFrameworkType)
                {
                    return new(type.FrameworkType, type.IsNullable);
                }
                else
                {
                    return new(type.Name, type.Namespace, type.IsNullable);
                }
            }
        }

        public record ExpectedFieldProvider(FieldModifiers Modifiers, ExpectedCSharpType Type, string Name);

        private static void AssertCSharpTypeAreEqual(ExpectedCSharpType expected, CSharpType type)
        {
            if (expected.IsFrameworkType)
            {
                Assert.IsTrue(type.IsFrameworkType);
                Assert.AreEqual(expected.FrameworkType, type.FrameworkType);
            }
            else
            {
                Assert.IsFalse(type.IsFrameworkType);
                Assert.AreEqual(expected.Name, type.Name);
                Assert.AreEqual(expected.Namespace, type.Namespace);
            }
            Assert.AreEqual(expected.IsNullable, type.IsNullable);
        }

        private static void AssertFieldAreEqual(ExpectedFieldProvider expected, FieldProvider field)
        {
            Assert.AreEqual(expected.Name, field.Name);
            AssertCSharpTypeAreEqual(expected.Type, field.Type);
            Assert.AreEqual(expected.Modifiers, field.Modifiers);
        }

        private static void AssertHasFields(TypeProvider provider, IReadOnlyList<ExpectedFieldProvider> expectedFields)
        {
            var fields = provider.Fields;

            // validate the length of the result
            Assert.GreaterOrEqual(fields.Count, expectedFields.Count);

            // validate each of them
            var fieldDict = fields.ToDictionary(f => f.Name);
            for (int i = 0; i < expectedFields.Count; i++)
            {
                var expected = expectedFields[i];

                Assert.IsTrue(fieldDict.TryGetValue(expected.Name, out var actual), $"Field {expected.Name} not present");
                AssertFieldAreEqual(expected, actual!);
            }
        }
    }
}
