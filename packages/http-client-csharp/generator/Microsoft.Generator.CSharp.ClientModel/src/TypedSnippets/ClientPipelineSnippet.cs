// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ClientPipelineSnippet(ValueExpression Expression) : TypedSnippet<ClientPipeline>(Expression)
    {
        private const string _processMessageAsync = "ProcessMessageAsync";
        private const string _processMessage = "ProcessMessage";
        private const string _processHeadAsBoolMessageAsync = "ProcessHeadAsBoolMessageAsync";
        private const string _processHeadAsBoolMessage = "ProcessHeadAsBoolMessage";

        public PipelineMessageSnippet CreateMessage(RequestOptionsSnippet requestOptions, ValueExpression responseClassifier)
            => new(Expression.Invoke(nameof(ClientPipeline.CreateMessage), requestOptions, responseClassifier));

        public PipelineResponseSnippet ProcessMessage(ValueExpression message, RequestOptionsSnippet? requestOptions, bool isAsync)
        {
            var arguments = new List<ValueExpression>
            {
                Expression,
                message,
                requestOptions ?? Null
            };

            return new(new InvokeStaticMethodExpression(Type, isAsync ? _processMessageAsync : _processMessage, arguments, CallAsExtension: true, CallAsAsync: isAsync));
        }

        public ClientResultSnippet ProcessHeadAsBoolMessage(ValueExpression message, RequestOptionsSnippet? requestContext, bool isAsync)
        {
            var arguments = new List<ValueExpression>
            {
                Expression,
                message,
                requestContext ?? Null
            };

            return new(new InvokeStaticMethodExpression(Type, isAsync ? _processHeadAsBoolMessageAsync : _processHeadAsBoolMessage, arguments, CallAsExtension: true, CallAsAsync: isAsync));
        }

        public static ClientPipelineSnippet Create() => new(InvokeStatic(nameof(ClientPipeline.Create)));
    }
}
