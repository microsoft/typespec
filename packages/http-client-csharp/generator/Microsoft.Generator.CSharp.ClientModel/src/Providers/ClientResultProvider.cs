// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.ClientModel;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record ClientResultProvider : ClientResponseApi
    {
        public ClientResultProvider(ValueExpression clientResult) : base(typeof(ClientResult), clientResult)
        {
        }

        public override HttpResponseApi GetRawResponse()
            => new PipelineResponseProvider(GetRawResponseExpression());

        private ScopedApi<PipelineResponse> GetRawResponseExpression()
            => Original.Invoke(nameof(ClientResponseApi.GetRawResponse)).As<PipelineResponse>();
    }
}
