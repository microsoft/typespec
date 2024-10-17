// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ClientPipelineApiSnippets
    {
        private const string _processMessageAsync = "ProcessMessageAsync";
        private const string _processMessage = "ProcessMessage";

        public static HttpResponseApi ProcessMessage(this ClientPipelineApi pipeline, ValueExpression message, HttpRequestOptionsApi? requestOptions, bool isAsync)
            => pipeline.Invoke(isAsync ? _processMessageAsync : _processMessage, [message, requestOptions ?? Null], isAsync).ToApi<HttpResponseApi>();
    }
}
