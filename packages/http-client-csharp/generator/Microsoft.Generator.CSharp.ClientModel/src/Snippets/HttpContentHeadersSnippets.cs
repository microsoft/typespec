// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Headers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
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
