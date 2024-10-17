// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.ClientModel;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
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
