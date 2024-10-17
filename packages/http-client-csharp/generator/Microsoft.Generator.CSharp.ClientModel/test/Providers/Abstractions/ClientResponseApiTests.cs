using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.Abstractions
{
    internal class ClientResponseApiTests
    {
        [Test]
        public void ValidateReturnTypeIsOverridden()
        {
            ClientProvider clientProvider = CreateMockClientProvider();

            // take the sync version of the method from the client provider
            var method = clientProvider.Methods.FirstOrDefault(x => !x.Signature.Name.EndsWith("Async"));
            Assert.NotNull(method);
            Assert.NotNull(method!.Signature.ReturnType);
            Assert.IsTrue(method!.Signature.ReturnType!.Equals(typeof(string)));
        }

        [Test]
        public void ValidateBodyOfClientOperationIsOverridden()
        {
            var clientProvider = CreateMockClientProvider();

            // take the sync version of the method from the client provider
            var method = clientProvider.Methods.FirstOrDefault(x => x.Signature.Parameters.Any(p => p.Type.Equals(typeof(RequestOptions))) && !x.Signature.Name.EndsWith("Async"));
            Assert.NotNull(method);
            Assert.NotNull(method!.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), method.BodyStatements!.ToDisplayString());
        }

        private static ClientProvider CreateMockClientProvider()
        {
            var client = InputFactory.Client("TestClient", [InputFactory.Operation("foo")]);
            MockHelpers.LoadMockPlugin(clientResponseApi: TestClientResponseApi.Instance);
            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(client);
            return clientProvider;
        }

        private record TestClientResponseApi : ClientResponseApi
        {
            private static TestClientResponseApi? _instance;
            internal static TestClientResponseApi Instance => _instance ??= new();
            private TestClientResponseApi() : base(typeof(string), Empty)
            {
            }

            public TestClientResponseApi(ValueExpression origin) : base(typeof(string), origin)
            {
            }

            public override HttpResponseApi GetRawResponse()
                => Original.Invoke("GetFakeRawResponse").ToApi<HttpResponseApi>();

            public override ValueExpression FromValue(ValueExpression valueExpression, HttpResponseApi response)
                => Original.Invoke("GetFakeFromValue");

            public override ValueExpression FromValue<ValueType>(ValueExpression valueExpression, HttpResponseApi response)
                => Original.Invoke("GetFakeFromValueGeneric", [valueExpression, response]);

            public override ValueExpression FromResponse(ValueExpression valueExpression)
                => Static<string>().Invoke("GetFakeFromResponse", [valueExpression]);

            public override ValueExpression CreateAsync(HttpResponseApi response)
                => Original.Invoke("GetFakeFromCreateAsync", [response]);

            public override ClientResponseApi FromExpression(ValueExpression original)
                => new TestClientResponseApi(original);

            public override ClientResponseApi ToExpression() => this;

            public override CSharpType ClientResponseType => typeof(string);

            public override CSharpType ClientResponseOfTType => typeof(List<>);

            public override CSharpType ClientResponseExceptionType => typeof(NotImplementedException);
        }
    }
}
