// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Headers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class HttpContentHeadersSnippets
    {
        public static ValueExpression ContentType(this ScopedApi<HttpContentHeaders> headers)
            => headers.Property(nameof(HttpContentHeaders.ContentType));

        public static ValueExpression ContentDisposition(this ScopedApi<HttpContentHeaders> headers)
            => headers.Property(nameof(HttpContentHeaders.ContentDisposition));

        public static ValueExpression ContentLength(this ScopedApi<HttpContentHeaders> headers)
            => headers.Property(nameof(HttpContentHeaders.ContentLength));
    }
}
