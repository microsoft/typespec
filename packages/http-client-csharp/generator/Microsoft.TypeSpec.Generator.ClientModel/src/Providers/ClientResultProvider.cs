// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.ClientModel;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal record ClientResultProvider : ClientResponseApi
    {
        public ClientResultProvider(ValueExpression clientResult) : base(typeof(ClientResult), clientResult)
        {
        }

        private static ClientResponseApi? _instance;
        internal static ClientResponseApi Instance => _instance ??= new ClientResultProvider(Empty);

        public override CSharpType ClientResponseType => typeof(ClientResult);

        public override CSharpType ClientResponseOfTType => typeof(ClientResult<>);
        public override CSharpType ClientCollectionResponseType => typeof(CollectionResult);
        public override CSharpType ClientCollectionAsyncResponseType => typeof(AsyncCollectionResult);
        public override CSharpType ClientCollectionResponseOfTType => typeof(CollectionResult<>);
        public override CSharpType ClientCollectionAsyncResponseOfTType => typeof(AsyncCollectionResult<>);

        private readonly Dictionary<ClientCollectionResultKey, TypeProvider> _collectionResultDefinitionCache = new();

        public override TypeProvider CreateClientCollectionResultDefinition(
            ClientProvider client,
            InputOperation operation,
            CSharpType? type,
            bool isAsync)
        {
            var resultKey = new ClientCollectionResultKey(client, operation, type, isAsync);
            if (_collectionResultDefinitionCache.TryGetValue(resultKey, out var result))
            {
                return result;
            }

            result = new CollectionResultDefinition(client, operation, type, isAsync);
            _collectionResultDefinitionCache.Add(resultKey, result);

            return result;
        }

        private readonly struct ClientCollectionResultKey
        {
            public ClientProvider Client { get; }
            public InputOperation Operation { get; }
            public CSharpType? ItemModelType { get; }
            public bool IsAsync { get; }

            public ClientCollectionResultKey(ClientProvider client, InputOperation operation, CSharpType? itemModelType, bool isAsync)
            {
                Client = client;
                Operation = operation;
                ItemModelType = itemModelType;
                IsAsync = isAsync;
            }
        }

        public override CSharpType ClientResponseExceptionType => typeof(ClientResultException);

        public override ValueExpression CreateAsync(HttpResponseApi response)
            => Static(ClientResponseExceptionType).Invoke(nameof(CreateAsync), [response], true);

        public override ClientResponseApi FromExpression(ValueExpression original)
            => new ClientResultProvider(original.As<ClientResult>());

        public override ClientResponseApi ToExpression() => this;

        public override ValueExpression FromResponse(ValueExpression valueExpression)
            => Static(ClientResponseType).Invoke(nameof(FromResponse), [valueExpression]);

        public override ValueExpression FromValue(ValueExpression valueExpression, HttpResponseApi response)
            => Static(ClientResponseType).Invoke(nameof(FromValue), [valueExpression, response]);

        public override ValueExpression FromValue<ValueType>(ValueExpression valueExpression, HttpResponseApi response)
            => Static(ClientResponseType).Invoke(nameof(FromValue), [valueExpression, response], [typeof(ValueType)], false);

        public override HttpResponseApi GetRawResponse()
            => new PipelineResponseProvider(GetRawResponseExpression());

        private ScopedApi<PipelineResponse> GetRawResponseExpression()
            => Original.Invoke(nameof(ClientResponseApi.GetRawResponse)).As<PipelineResponse>();
    }
}
