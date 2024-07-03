// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ClientResultSnippets
    {
        public static ValueExpression Value(this ScopedApi<ClientResult> clientResult) => clientResult.Property(nameof(ClientResult<object>.Value));

        public static ScopedApi<ClientResult> FromResponse(PipelineResponseSnippet response)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromResponse), response).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(ValueExpression value, PipelineResponseSnippet response)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), value, response).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(CSharpType explicitValueType, ValueExpression value, PipelineResponseSnippet response)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [value, response], [explicitValueType], false).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(this ScopedApi<ClientResult> clientResult, ValueExpression value)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [value, clientResult]).As<ClientResult>();

        public static ScopedApi<ClientResult> FromValue(this ScopedApi<ClientResult> clientResult, CSharpType explicitValueType, ValueExpression value)
            => Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [value, clientResult], [explicitValueType], false).As<ClientResult>();

        public static PipelineResponseSnippet GetRawResponse(this ScopedApi<ClientResult> clientResult) => new(clientResult.Invoke(nameof(ClientResult<object>.GetRawResponse)));
    }
}
