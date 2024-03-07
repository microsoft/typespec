// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using Azure.Core;
using Azure.Core.Pipeline;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record HttpPipelineExpression(ValueExpression Untyped) : TypedValueExpression<HttpPipeline>(Untyped)
    {
        public HttpMessageExpression CreateMessage() => new(Invoke(nameof(HttpPipeline.CreateMessage)));
        public HttpMessageExpression CreateMessage(RequestContextExpression requestContext) => new(Invoke(nameof(HttpPipeline.CreateMessage), requestContext));
        public HttpMessageExpression CreateMessage(RequestContextExpression requestContext, ValueExpression responseClassifier) => new(Invoke(nameof(HttpPipeline.CreateMessage), requestContext, responseClassifier));

        public TypedValueExpression ProcessMessage(HttpMessageExpression message, RequestContextExpression? requestContext, CancellationTokenExpression? cancellationToken, bool async)
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

            var methodName = async ? nameof(HttpPipelineExtensions.ProcessMessageAsync) : nameof(HttpPipelineExtensions.ProcessMessage);
            return new ResponseExpression(InvokeExtension(typeof(HttpPipelineExtensions), methodName, arguments, async));
        }

        public ValueExpression ProcessHeadAsBoolMessage(HttpMessageExpression message, ValueExpression clientDiagnostics, RequestContextExpression? requestContext, bool async)
        {
            var arguments = new List<ValueExpression>
            {
                message,
                clientDiagnostics,
                requestContext ?? Snippets.Null
            };

            var methodName = async ? nameof(HttpPipelineExtensions.ProcessHeadAsBoolMessageAsync) : nameof(HttpPipelineExtensions.ProcessHeadAsBoolMessage);
            return InvokeExtension(typeof(HttpPipelineExtensions), methodName, arguments, async);
        }

        public MethodBodyStatement Send(HttpMessageExpression message, CancellationTokenExpression cancellationToken, bool async)
        {
            var methodName = async ? nameof(HttpPipeline.SendAsync) : nameof(HttpPipeline.Send);
            return new InvokeInstanceMethodStatement(Untyped, methodName, new ValueExpression[] { message, cancellationToken }, async);
        }
    }
}
