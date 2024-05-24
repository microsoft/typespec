// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record ClientResultExpression(ValueExpression Untyped) : TypedSnippet<ClientResult>(Untyped)
    {
        public ValueExpression Value => Property(nameof(ClientResult<object>.Value));
        public BinaryDataSnippet Content => throw new InvalidOperationException("Result does not have a Content property");
        public StreamSnippet ContentStream => throw new InvalidOperationException("Result does not have a ContentStream property");

        public static ClientResultExpression FromResponse(PipelineResponseExpression response)
            => new(InvokeStatic(nameof(ClientResult.FromResponse), response));

        public static ClientResultExpression FromValue(ValueExpression value, PipelineResponseExpression response)
            => new(InvokeStatic(nameof(ClientResult.FromValue), value, response));

        public static ClientResultExpression FromValue(CSharpType explicitValueType, ValueExpression value, PipelineResponseExpression response)
            => new(new InvokeStaticMethodExpression(typeof(ClientResult), nameof(ClientResult.FromValue), new[] { value, response }, new[] { explicitValueType }));

        public ClientResultExpression FromValue(ValueExpression value)
            => new(new InvokeStaticMethodExpression(typeof(ClientResult), nameof(ClientResult.FromValue), new[] { value, this }));

        public ClientResultExpression FromValue(CSharpType explicitValueType, ValueExpression value)
            => new(new InvokeStaticMethodExpression(typeof(ClientResult), nameof(ClientResult.FromValue), new[] { value, this }, new[] { explicitValueType }));

        public PipelineResponseExpression GetRawResponse() => new(Untyped.Invoke(nameof(ClientResult<object>.GetRawResponse)));
    }
}
