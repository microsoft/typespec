// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Primitives;
using TypeSpec.Generator.Snippets;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class RequestOptionsSnippets
    {
        public static ScopedApi<RequestOptions> FromCancellationToken()
            => Static<RequestOptions>().Invoke("FromCancellationToken", [KnownParameters.CancellationTokenParameter]).As<RequestOptions>();

        public static ValueExpression ErrorOptions(this ScopedApi<RequestOptions> requestOptions) => requestOptions.Property(nameof(RequestOptions.ErrorOptions));
    }
}
