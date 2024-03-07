// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Internal;
using System.ClientModel.Primitives.Pipeline;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record MessagePipelineExpression(ValueExpression Untyped) : TypedValueExpression<MessagePipeline>(Untyped)
    {
        public PipelineMessageExpression CreateMessage(RequestOptionsExpression requestContext, ValueExpression responseClassifier) => new(Invoke(nameof(MessagePipeline.CreateMessage), requestContext, responseClassifier));
        public PipelineResponseExpression ProcessMessage(TypedValueExpression message, RequestOptionsExpression? requestContext, CancellationTokenExpression? cancellationToken, bool async)
        {
            var arguments = new List<ValueExpression>
            {
                message,
                requestContext ?? Snippets.Null
            };

            if (cancellationToken != null)
            {
                arguments.Add(cancellationToken);
            }

            var methodName = async ? nameof(PipelineProtocolExtensions.ProcessMessageAsync) : nameof(PipelineProtocolExtensions.ProcessMessage);
            return new(InvokeExtension(typeof(PipelineProtocolExtensions), methodName, arguments, async));
        }

        public ResultExpression ProcessHeadAsBoolMessage(TypedValueExpression message, ValueExpression clientDiagnostics, RequestOptionsExpression? requestContext, bool async)
        {
            var arguments = new List<ValueExpression>
            {
                message,
                clientDiagnostics,
                requestContext ?? Snippets.Null
            };

            var methodName = async ? nameof(PipelineProtocolExtensions.ProcessHeadAsBoolMessageAsync) : nameof(PipelineProtocolExtensions.ProcessHeadAsBoolMessage);
            return new(InvokeExtension(typeof(PipelineProtocolExtensions), methodName, arguments, async));
        }
    }
}
