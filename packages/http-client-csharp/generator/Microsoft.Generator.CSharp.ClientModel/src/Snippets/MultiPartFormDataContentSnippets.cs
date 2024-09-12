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
        public static ScopedApi<HttpContentHeaders> Headers(this ScopedApi<MultipartFormDataContent> mpfdContent)
            => mpfdContent.Property(nameof(MultipartFormDataContent.Headers)).As<HttpContentHeaders>();

        public static InvokeMethodExpression CopyToAsync(this ScopedApi<MultipartFormDataContent> mpfdContent, ValueExpression destination, bool isAsync = true)
            => mpfdContent.Invoke(nameof(MultipartFormDataContent.CopyToAsync), [destination], null, isAsync, isAsync);

        public static InvokeMethodExpression CopyToAsync(this ScopedApi<MultipartFormDataContent> mpfdContent, ValueExpression destination, ValueExpression cancellationTokenExpression)
            => mpfdContent.Invoke(nameof(MultipartFormDataContent.CopyToAsync), [destination], null, true, true);

        public static InvokeMethodExpression CopyTo(this ScopedApi<MultipartFormDataContent> mpfdContent, ValueExpression destination, ValueExpression cancellationTokenExpression)
            => mpfdContent.Invoke(nameof(MultipartFormDataContent.CopyTo), [destination, Default, cancellationTokenExpression]);

        public static InvokeMethodExpression Add(this ScopedApi<MultipartFormDataContent> mpfdContent, ValueExpression content, ValueExpression name)
            => mpfdContent.Invoke(nameof(MultipartFormDataContent.Add), [content, name]);

        public static InvokeMethodExpression Add(this ScopedApi<MultipartFormDataContent> mpfdContent, ValueExpression content, ValueExpression name, ValueExpression fileName)
            => mpfdContent.Invoke(nameof(MultipartFormDataContent.Add), [content, name, fileName]);
    }
}
