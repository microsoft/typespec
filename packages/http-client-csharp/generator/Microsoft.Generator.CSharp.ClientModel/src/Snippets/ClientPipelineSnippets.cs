// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ClientPipelineSnippets
    {
        private const string _processMessageAsync = "ProcessMessageAsync";
        private const string _processMessage = "ProcessMessage";
        private const string _processHeadAsBoolMessageAsync = "ProcessHeadAsBoolMessageAsync";
        private const string _processHeadAsBoolMessage = "ProcessHeadAsBoolMessage";

        public static ScopedApi<PipelineMessage> CreateMessage(this ScopedApi<ClientPipeline> pipeline)
            => pipeline.Invoke(nameof(ClientPipeline.CreateMessage)).As<PipelineMessage>();

        public static ScopedApi<PipelineMessage> CreateMessage(this ScopedApi<ClientPipeline> pipeline, ScopedApi<RequestOptions> requestOptions, ValueExpression responseClassifier)
            => pipeline.Invoke(nameof(ClientPipeline.CreateMessage), requestOptions, responseClassifier).As<PipelineMessage>();

        public static ScopedApi<PipelineResponse> ProcessMessage(this ScopedApi<ClientPipeline> pipeline, ValueExpression message, ScopedApi<RequestOptions>? requestOptions, bool isAsync)
            => pipeline.Invoke(isAsync ? _processMessageAsync : _processMessage, [message, requestOptions ?? Null], isAsync).As<PipelineResponse>();

        public static ScopedApi<ClientResult> ProcessHeadAsBoolMessage(this ScopedApi<ClientPipeline> pipeline, ValueExpression message, ScopedApi<RequestOptions>? requestContext, bool isAsync)
            => pipeline.Invoke(isAsync ? _processHeadAsBoolMessageAsync : _processHeadAsBoolMessage, [message, requestContext ?? Null], isAsync).As<ClientResult>();

        public static ScopedApi<ClientPipeline> Create() => Static<ClientPipeline>().Invoke(nameof(ClientPipeline.Create)).As<ClientPipeline>();
        public static ScopedApi<ClientPipeline> Create(params ValueExpression[] arguments)
            => Static<ClientPipeline>().Invoke(nameof(ClientPipeline.Create), arguments).As<ClientPipeline>();
    }
}
