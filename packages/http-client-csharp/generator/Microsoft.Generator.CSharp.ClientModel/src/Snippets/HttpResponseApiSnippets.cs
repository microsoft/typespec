// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class HttpResponseApiSnippets
    {
        public static ScopedApi<BinaryData> Content(this HttpResponseApi pipelineMessage)
            => pipelineMessage.Property(nameof(HttpResponseApi.Content)).As<BinaryData>();

        public static ScopedApi<Stream> ContentStream(this HttpResponseApi pipelineMessage)
            => pipelineMessage.Property(nameof(HttpResponseApi.ContentStream)).As<Stream>();

        public static ScopedApi<bool> IsError(this HttpResponseApi pipelineMessage)
            => pipelineMessage.Property(nameof(HttpResponseApi.IsError)).As<bool>();
    }
}
