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

        public static ScopedApi<PipelineMessage> CreateMessage(this ScopedApi<ClientPipeline> pipeline, RequestOptionsSnippet requestOptions, ValueExpression responseClassifier)
            => new(pipeline.Invoke(nameof(ClientPipeline.CreateMessage), requestOptions, responseClassifier));

        public static PipelineResponseSnippet ProcessMessage(this ScopedApi<ClientPipeline> pipeline, ValueExpression message, RequestOptionsSnippet? requestOptions, bool isAsync)
            => new(pipeline.Invoke(isAsync ? _processMessageAsync : _processMessage, [message, requestOptions ?? Null], isAsync));

        public static ScopedApi<ClientResult> ProcessHeadAsBoolMessage(this ScopedApi<ClientPipeline> pipeline, ValueExpression message, RequestOptionsSnippet? requestContext, bool isAsync)
            => pipeline.Invoke(isAsync ? _processHeadAsBoolMessageAsync : _processHeadAsBoolMessage, [message, requestContext ?? Null], isAsync).As<ClientResult>();

        public static ScopedApi<ClientPipeline> Create() => Static<ClientPipeline>().Invoke(nameof(ClientPipeline.Create)).As<ClientPipeline>();
    }
}
