// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class PipelineMessageSnippets
    {
        public static ScopedApi<PipelineRequest> Request(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.Request)).As<PipelineRequest>();

        public static ScopedApi<PipelineResponse> Response(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.Response)).As<PipelineResponse>();

        public static ScopedApi<bool> BufferResponse(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.BufferResponse)).As<bool>();

        public static ScopedApi<PipelineResponse> ExtractResponse(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Invoke(nameof(PipelineMessage.ExtractResponse), []).As<PipelineResponse>();
    }
}
