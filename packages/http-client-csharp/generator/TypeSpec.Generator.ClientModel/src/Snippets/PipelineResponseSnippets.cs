// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using TypeSpec.Generator.Snippets;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class PipelineResponseSnippets
    {
        public static ScopedApi<BinaryData> Content(this ScopedApi<PipelineResponse> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineResponse.Content)).As<BinaryData>();

        public static ScopedApi<Stream> ContentStream(this ScopedApi<PipelineResponse> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineResponse.ContentStream)).As<Stream>();

        public static ScopedApi<bool> IsError(this ScopedApi<PipelineResponse> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineResponse.IsError)).As<bool>();
    }
}
