using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.Abstractions
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

        private static ClientProvider CreateTestClient()
        {
            var client = InputFactory.Client("TestClient", [InputFactory.Operation("foo")]);
            MockHelpers.LoadMockPlugin(clientPipelineApi: TestClientPipelineApi.Instance);
            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(client);
            return clientProvider;
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

            public override ValueExpression CreateMessage(HttpRequestOptionsApi requestOptions, ValueExpression responseClassifier)
                => Original.Invoke("GetFakeCreateMessage", [requestOptions, responseClassifier]);

            public override ClientPipelineApi FromExpression(ValueExpression expression)
                => new TestClientPipelineApi(expression);

            public override ValueExpression KeyAuthorizationPolicy(ValueExpression credential, ValueExpression headerName, ValueExpression? keyPrefix = null)
                => Original.Invoke("GetFakeAuthorizationPolicy", keyPrefix == null ? [credential, headerName] : [credential, headerName, keyPrefix]);

            public override ValueExpression TokenAuthorizationPolicy(ValueExpression credential, ValueExpression scopes)
                => Original.Invoke("GetFakeTokenAuthorizationPolicy", [credential, scopes]);

            public override ClientPipelineApi ToExpression() => this;

            public override MethodBodyStatement[] ProcessMessage(HttpMessageApi message, HttpRequestOptionsApi options)
                => [Original.Invoke("GetFakeProcessMessage", [message, options]).Terminate()];

            public override MethodBodyStatement[] ProcessMessageAsync(HttpMessageApi message, HttpRequestOptionsApi options)
                => [Original.Invoke("GetFakeProcessMessageAsync", [message, options]).Terminate()];
        }
    }
}
