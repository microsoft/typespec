// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class PipelineMessageSnippets
    {
        public static ScopedApi<PipelineRequest> Request(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.Request)).As<PipelineRequest>();

        public static HttpResponseApi Response(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.Response)).ToApi<HttpResponseApi>();

        public static ScopedApi<bool> BufferResponse(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.BufferResponse)).As<bool>();

        public static HttpResponseApi ExtractResponse(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Invoke(nameof(PipelineMessage.ExtractResponse), []).ToApi<HttpResponseApi>();

        public static ScopedApi<PipelineMessageClassifier> ResponseClassifier(this ScopedApi<PipelineMessage> pipelineMessage)
            => pipelineMessage.Property(nameof(PipelineMessage.ResponseClassifier)).As<PipelineMessageClassifier>();

        public static InvokeMethodExpression Apply(this ScopedApi<PipelineMessage> pipelineMessage, ValueExpression options)
            => pipelineMessage.Invoke(nameof(PipelineMessage.Apply), options);
    }
}
