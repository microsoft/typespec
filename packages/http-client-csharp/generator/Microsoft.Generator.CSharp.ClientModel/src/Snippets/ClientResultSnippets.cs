// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ClientResultSnippets
    {
        public static ValueExpression Value(this ScopedApi<ClientResult> clientResult) => clientResult.Property(nameof(ClientResult<object>.Value));

        public static ScopedApi<ClientResult> FromResponse(ScopedApi<PipelineResponse> response)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromResponse), response).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(ValueExpression value, ScopedApi<PipelineResponse> response)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), value, response).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(CSharpType explicitValueType, ValueExpression value, ScopedApi<PipelineResponse> response)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [value, response], [explicitValueType], false).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(this ScopedApi<ClientResult> clientResult, ValueExpression value)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [value, clientResult]).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(this ScopedApi<ClientResult> clientResult, CSharpType explicitValueType, ValueExpression value)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [value, clientResult], [explicitValueType], false).As<ClientResult>();

        public static ScopedApi<PipelineResponse> GetRawResponse(this ScopedApi<ClientResult> clientResult)
            => clientResult.Invoke(nameof(ClientResult<object>.GetRawResponse)).As<PipelineResponse>();
    }
}
