// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class MultiPartFormDataContentSnippets
    {
        public static ScopedApi<HttpContentHeaders> Headers(this ScopedApi<MultipartFormDataContent> multipartContent)
            => multipartContent.Property(nameof(MultipartFormDataContent.Headers)).As<HttpContentHeaders>();

        public static InvokeMethodExpression CopyToAsync(this ScopedApi<MultipartFormDataContent> multipartContent, ValueExpression destination, bool isAsync = true)
            => multipartContent.Invoke(nameof(MultipartFormDataContent.CopyToAsync), [destination], null, isAsync, isAsync);

        public static InvokeMethodExpression CopyToAsync(this ScopedApi<MultipartFormDataContent> multipartContent, ValueExpression destination, ValueExpression cancellationTokenExpression)
            => multipartContent.Invoke(nameof(MultipartFormDataContent.CopyToAsync), [destination], null, true, true);

        public static InvokeMethodExpression CopyTo(this ScopedApi<MultipartFormDataContent> multipartContent, ValueExpression destination, ValueExpression cancellationTokenExpression)
            => multipartContent.Invoke(nameof(MultipartFormDataContent.CopyTo), [destination, Default, cancellationTokenExpression]);

        public static InvokeMethodExpression Add(this ScopedApi<MultipartFormDataContent> multipartContent, ValueExpression content, ValueExpression name)
            => multipartContent.Invoke(nameof(MultipartFormDataContent.Add), [content, name]);

        public static InvokeMethodExpression Add(this ScopedApi<MultipartFormDataContent> multipartContent, ValueExpression content, ValueExpression name, ValueExpression fileName)
            => multipartContent.Invoke(nameof(MultipartFormDataContent.Add), [content, name, fileName]);
    }
}
