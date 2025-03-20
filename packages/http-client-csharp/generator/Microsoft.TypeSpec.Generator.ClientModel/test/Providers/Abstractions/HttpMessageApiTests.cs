using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Abstractions
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
            var client = InputFactory.Client("TestClient", operations: [InputFactory.Operation("foo")]);
            MockHelpers.LoadMockGenerator(httpMessageApi: TestHttpMessageApi.Instance);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);
            return clientProvider!;
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
