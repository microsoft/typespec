// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class HttpResponseApiSnippets
    {
        public static ScopedApi<BinaryData> Content(this HttpResponseApi pipelineMessage)
            => pipelineMessage.Property(nameof(HttpResponseApi.Content)).As<BinaryData>();

        public static ScopedApi<Stream> ContentStream(this HttpResponseApi pipelineMessage)
            => pipelineMessage.Property(nameof(HttpResponseApi.ContentStream)).As<Stream>();

        public static ScopedApi<bool> IsError(this HttpResponseApi pipelineMessage)
            => pipelineMessage.Property(nameof(HttpResponseApi.IsError)).As<bool>();

        public static ScopedApi<bool> TryGetHeader(
            this ScopedApi<HttpResponseApi> pipelineMessage,
            string name,
            out ScopedApi<string>? value)
        {
            return pipelineMessage.TryGetHeader(name, out value);
        }
    }
}
