// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Abstractions
{
    internal class ClientResponseApiTests
    {
        [Test]
        public void ValidateReturnTypeIsOverridden()
        {
            (ClientProvider clientProvider, _) = CreateMockClientProvider();

            // take the sync version of the method from the client provider
            var method = clientProvider.Methods.FirstOrDefault(x => !x.Signature.Name.EndsWith("Async"));
            Assert.NotNull(method);
            Assert.NotNull(method!.Signature.ReturnType);
            Assert.IsTrue(method!.Signature.ReturnType!.Equals(typeof(string)));
        }

        [Test]
        public void ValidateBodyOfClientOperationIsOverridden()
        {
            (ClientProvider clientProvider, _) = CreateMockClientProvider();

            // take the sync version of the method from the client provider
            var method = clientProvider.Methods.FirstOrDefault(x => x.Signature.Parameters.Any(p => p.Type.Equals(typeof(RequestOptions))) && !x.Signature.Name.EndsWith("Async"));
            Assert.NotNull(method);
            Assert.NotNull(method!.BodyStatements);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), method.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void ValidateExplicitOperator()
        {
            (_, ModelProvider modelProvider) = CreateMockClientProvider();

            var explicitOperator = modelProvider.SerializationProviders.First().Methods.FirstOrDefault(m => m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Explicit));
            Assert.NotNull(explicitOperator);
            var parameter = explicitOperator!.Signature.Parameters.FirstOrDefault();
            Assert.NotNull(parameter);
            Assert.AreEqual("stringResponse", parameter!.Name);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), explicitOperator!.BodyStatements!.ToDisplayString());
        }

        private static (ClientProvider, ModelProvider) CreateMockClientProvider()
        {
            var responseModel = InputFactory.Model("Bar");
            var operationResponse = InputFactory.OperationResponse(bodytype: responseModel);
            var serviceResponse = InputFactory.ServiceMethodResponse(responseModel, null);
            var inputServiceMethod = InputFactory.BasicServiceMethod("foo", InputFactory.Operation("foo", responses: [operationResponse]), response: serviceResponse);
            var client = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            var generator = MockHelpers.LoadMockGenerator(
                clientResponseApi: TestClientResponseApi.Instance,
                inputModels: () => [responseModel],
                clients: () => [client]);
            var modelProvider = generator.Object.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .FirstOrDefault(m => m.Name == "Bar");
            var clientProvider = generator.Object.OutputLibrary.TypeProviders
                .OfType<ClientProvider>()
                .FirstOrDefault(c => c.Name == "TestClient");

            Assert.IsNotNull(clientProvider);
            Assert.IsNotNull(modelProvider);

            return (clientProvider!, modelProvider!);
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
                => Original.ToApi<HttpResponseApi>();

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
            public override CSharpType ClientCollectionResponseType => typeof(CollectionResult);
            public override CSharpType ClientCollectionAsyncResponseType => typeof(AsyncCollectionResult);
            public override CSharpType ClientCollectionResponseOfTType => typeof(CollectionResult<>);
            public override CSharpType ClientCollectionAsyncResponseOfTType => typeof(AsyncCollectionResult<>);
            public override string ResponseParameterName => "stringResponse";

            public override TypeProvider CreateClientCollectionResultDefinition(
                ClientProvider client,
                InputPagingServiceMethod serviceMethod,
                CSharpType? type,
                bool isAsync)
            {
                return new CollectionResultDefinition(client, serviceMethod, type, isAsync);
            }

            public override CSharpType ClientResponseExceptionType => typeof(NotImplementedException);
        }
    }
}
