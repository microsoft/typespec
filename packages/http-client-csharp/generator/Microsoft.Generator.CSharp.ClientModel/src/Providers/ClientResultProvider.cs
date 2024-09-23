// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.ClientModel;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record ClientResultProvider : ClientResponseApi
    {
        public ClientResultProvider(ValueExpression clientResult) : base(typeof(ClientResult), clientResult)
        {
        }

        public override ValueExpression CreateAsync(HttpResponseApi response)
            => Static(ClientModelPlugin.Instance.TypeFactory.ClientResponseType).Invoke(nameof(CreateAsync), [response], true);

        public override ValueExpression FromResponse(ValueExpression valueExpression)
            => Static(ClientModelPlugin.Instance.TypeFactory.ClientResponseExceptionType).Invoke(nameof(FromResponse), [valueExpression]);

        public override ValueExpression FromValue(ValueExpression valueExpression, HttpResponseApi response)
            => Static(ClientModelPlugin.Instance.TypeFactory.ClientResponseType).Invoke(nameof(FromValue), [valueExpression, response]);

        public override ValueExpression FromValue<ValueType>(ValueExpression valueExpression, HttpResponseApi response)
            => Static(ClientModelPlugin.Instance.TypeFactory.ClientResponseType).Invoke(nameof(FromValue), [valueExpression, response], [typeof(ValueType)], false).ToApi<ClientResponseApi>();

        public override HttpResponseApi GetRawResponse()
            => new PipelineResponseProvider(GetRawResponseExpression());

        private ScopedApi<PipelineResponse> GetRawResponseExpression()
            => Original.Invoke(nameof(ClientResponseApi.GetRawResponse)).As<PipelineResponse>();
    }
}
