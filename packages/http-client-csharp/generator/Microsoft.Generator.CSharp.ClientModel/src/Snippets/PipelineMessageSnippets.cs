// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class PipelineMessageSnippets
    {
        public static PipelineRequestSnippet Request(this ScopedApi<PipelineMessage> pipelineMessage)
            => new(pipelineMessage.Property(nameof(PipelineMessage.Request)));

        public static PipelineResponseSnippet Response(this ScopedApi<PipelineMessage> pipelineMessage)
            => new(pipelineMessage.Property(nameof(PipelineMessage.Response)));

        public static ScopedApi<bool> BufferResponse(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.BufferResponse)).As<bool>();

        public static PipelineResponseSnippet ExtractResponse(this ScopedApi<PipelineMessage> pipelineMessage)
            => new(pipelineMessage.Invoke(nameof(PipelineMessage.ExtractResponse), []));
    }
}
