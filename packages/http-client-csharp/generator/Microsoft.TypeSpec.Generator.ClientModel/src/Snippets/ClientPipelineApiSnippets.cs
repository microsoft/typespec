// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class ClientPipelineApiSnippets
    {
        private const string _processMessageAsync = "ProcessMessageAsync";
        private const string _processMessage = "ProcessMessage";

        public static HttpResponseApi ProcessMessage(this ClientPipelineApi pipeline, ValueExpression message, HttpRequestOptionsApi? requestOptions, bool isAsync)
            => pipeline.Invoke(isAsync ? _processMessageAsync : _processMessage, [message, requestOptions ?? Null], isAsync).ToApi<HttpResponseApi>();
    }
}
