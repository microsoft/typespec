using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.Abstractions
{
    internal class HttpMessageApiTests
    {
        [Test]
        public void ValidateReturnTypeOfCreateRequestIsOverridden()
        {
            var client = CreateTestClient();
            var restClient = client.RestClient;
            var method = restClient.Methods.FirstOrDefault(m => m.Signature.Name == "CreateFooRequest");

            Assert.IsNotNull(method);
            Assert.IsNotNull(method!.Signature.ReturnType);
            Assert.IsTrue(method!.Signature.ReturnType!.Equals(typeof(string)));
        }

        [Test]
        public void ValidateBodyOfProcessMessageIsOverridden()
        {
            var client = CreateTestClient();
            var method = client.Methods.FirstOrDefault(x => x.Signature.Parameters.Any(p => p.Type.Equals(typeof(RequestOptions))) && !x.Signature.Name.EndsWith("Async"));

            Assert.IsNotNull(method);
            Assert.IsNotNull(method!.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), method!.BodyStatements!.ToDisplayString());
        }

        private static ClientProvider CreateTestClient()
        {
            var client = InputFactory.Client("TestClient", [InputFactory.Operation("foo")]);
            MockHelpers.LoadMockPlugin(httpMessageApi: TestHttpMessageApi.Instance);
            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(client);
            return clientProvider;
        }

        private record TestHttpMessageApi : HttpMessageApi
        {
            private static HttpMessageApi? _instance;
            internal static HttpMessageApi Instance => _instance ??= new TestHttpMessageApi(Empty);

            public TestHttpMessageApi(ValueExpression original) : base(typeof(string), original)
            {
            }

            public override CSharpType HttpMessageType => typeof(string);

            public override MethodBodyStatement ApplyRequestOptions(HttpRequestOptionsApi options)
                => Original.Invoke("GetFakeSetRequestContext", [options]).Terminate();

            public override ValueExpression BufferResponse()
                => Original.Invoke("GetFakeBufferResponse");

            public override MethodBodyStatement[] ExtractResponse()
                => [Return(Original.Invoke("GetFakeExtractResponse"))];

            public override HttpMessageApi FromExpression(ValueExpression original)
                => new TestHttpMessageApi(original);

            public override HttpRequestApi Request()
                => Original.Invoke("GetFakeRequest").ToApi<HttpRequestApi>();

            public override HttpResponseApi Response()
                => Original.Invoke("GetFakeResponse").ToApi<HttpResponseApi>();

            public override MethodBodyStatement ApplyResponseClassifier(StatusCodeClassifierApi statusCodeClassifier)
                => Original.Invoke("GetFakeAssignResponseClassifier", [statusCodeClassifier]).Terminate();

            public override HttpMessageApi ToExpression() => this;
        }
    }
}
