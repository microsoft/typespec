// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Abstractions
{
    internal class ClientPipelineApiTests
    {
        [Test]
        public void ValidatePipelinePropertyTypeIsOverridden()
        {
            ClientProvider clientProvider = CreateTestClient();
            var pipelineProperty = clientProvider.Properties.FirstOrDefault(x => x.Name == "Pipeline");

            Assert.NotNull(pipelineProperty);
            Assert.IsTrue(pipelineProperty!.Type.Equals(typeof(string)));
        }

        [Test]
        public void ValidateBodyOfRestClientOperationIsOverridden()
        {
            var clientProvider = CreateTestClient();
            var restClient = clientProvider.RestClient;
            var method = restClient.Methods.FirstOrDefault(m => m.Signature.Name == "CreateFooRequest");

            Assert.NotNull(method);
            Assert.NotNull(method!.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), method!.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void ProcessMessageIsOverridden()
        {
            CreateTestClient();
            var clientPipelineExtensions = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.
                FirstOrDefault(x => x.Name == "ClientPipelineExtensions");
            Assert.NotNull(clientPipelineExtensions);
            var method = clientPipelineExtensions!.Methods.FirstOrDefault(m => m.Signature.Name == "ProcessMessage");
            Assert.NotNull(method);
            Assert.NotNull(method!.BodyStatements);
            Assert.IsTrue(method.BodyStatements!.ToDisplayString().Contains("GetFakeProcessMessage"));

            method = clientPipelineExtensions!.Methods.FirstOrDefault(m => m.Signature.Name == "ProcessMessageAsync");
            Assert.NotNull(method);
            Assert.NotNull(method!.BodyStatements);
            Assert.IsTrue(method.BodyStatements!.ToDisplayString().Contains("GetFakeProcessMessageAsync"));
        }

        private static ClientProvider CreateTestClient()
        {
            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "test",
                InputFactory.Operation(
                    "foo",
                    parameters:
                    [
                        InputFactory.HeaderParameter("foo-header", InputPrimitiveType.String),
                        InputFactory.QueryParameter("foo-query", InputPrimitiveType.String)
                    ]));
            var client = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            MockHelpers.LoadMockGenerator(clientPipelineApi: TestClientPipelineApi.Instance);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);
            return clientProvider!;
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

            public override CSharpType KeyCredentialType => typeof(object);

            public override CSharpType TokenCredentialType => typeof(object);

            public override ValueExpression Create(ValueExpression options, ValueExpression perRetryPolicies)
                => Original.Invoke("GetFakeCreate", [options, perRetryPolicies]);

            public override MethodBodyStatement[] CreateMessage(HttpRequestOptionsApi requestOptions,
                ValueExpression uri,
                ValueExpression method,
                ValueExpression responseClassifier,
                out HttpMessageApi message,
                out HttpRequestApi request)
            =>
            [
               Declare("message", Original.Invoke("GetFakeCreateMessage", [requestOptions, uri, method, responseClassifier]).ToApi<HttpMessageApi>(), out message),
               Declare("request", message.Request(), out request)
            ];

            public override ClientPipelineApi FromExpression(ValueExpression expression)
                => new TestClientPipelineApi(expression);

            public override ValueExpression KeyAuthorizationPolicy(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null)
                => Original.Invoke("GetFakeAuthorizationPolicy", keyPrefix == null ? [credential, headerName] : [credential, headerName, keyPrefix]);

            public override ValueExpression TokenAuthorizationPolicy(ValueExpression credential, ValueExpression scopes)
                => Original.Invoke("GetFakeTokenAuthorizationPolicy", [credential, scopes]);

            public override ClientPipelineApi ToExpression() => this;

            public override MethodBodyStatement[] SendMessage(HttpMessageApi message, HttpRequestOptionsApi options)
                => [Original.Invoke("GetFakeProcessMessage", [message, options]).Terminate()];

            public override MethodBodyStatement[] SendMessageAsync(HttpMessageApi message, HttpRequestOptionsApi options)
                => [Original.Invoke("GetFakeProcessMessageAsync", [message, options]).Terminate()];
        }
    }
}
