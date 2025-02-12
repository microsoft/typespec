// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class HttpContentSnippets
    {
        public static ScopedApi<HttpContentHeaders> Headers(this ScopedApi<HttpContent> multipartContent)
          => multipartContent.Property(nameof(HttpContent.Headers)).As<HttpContentHeaders>();
    }
}
