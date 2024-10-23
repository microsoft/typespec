// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class RequestOptionsSnippets
    {
        public static ScopedApi<RequestOptions> FromCancellationToken()
            => Static<RequestOptions>().Invoke("FromCancellationToken", [KnownParameters.CancellationTokenParameter]).As<RequestOptions>();

        public static ValueExpression ErrorOptions(this ScopedApi<RequestOptions> requestOptions) => requestOptions.Property(nameof(RequestOptions.ErrorOptions));
    }
}
