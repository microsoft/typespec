// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives.Pipeline;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record MessagePipelineExpression(ValueExpression Untyped) : TypedValueExpression<MessagePipeline>(Untyped)
    {
        public PipelineMessageExpression CreateMessage(RequestOptionsExpression requestContext, ValueExpression responseClassifier) => new(Invoke(nameof(MessagePipeline.CreateMessage), requestContext, responseClassifier));
        public PipelineResponseExpression ProcessMessage(TypedValueExpression message, RequestOptionsExpression? requestContext, CancellationTokenExpression? cancellationToken, bool async)
        {
            var arguments = new List<ValueExpression>
            {
                Untyped,
                message,
                requestContext ?? Snippets.Null
            };

            if (cancellationToken != null)
            {
                arguments.Add(cancellationToken);
            }

            // uncomment when this is implemented
            //return ClientPipelineExtensionsProvider.Instance.ProcessMessage(arguments, async);
            throw new NotImplementedException();
        }

        public ResultExpression ProcessHeadAsBoolMessage(TypedValueExpression message, RequestOptionsExpression? requestContext, bool async)
        {
            var arguments = new List<ValueExpression>
            {
                Untyped,
                message,
                requestContext ?? Snippets.Null
            };

            // uncomment when this is implemented
            //return ClientPipelineExtensionsProvider.Instance.ProcessHeadAsBoolMessage(arguments, async);
            throw new NotImplementedException();
        }
    }
}
