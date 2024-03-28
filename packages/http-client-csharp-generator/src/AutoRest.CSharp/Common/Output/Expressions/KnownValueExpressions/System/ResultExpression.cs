// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record ResultExpression(ValueExpression Untyped) : TypedValueExpression<Result>(Untyped)
    {
        public ValueExpression Value => Property(nameof(Result<object>.Value));
        public BinaryDataExpression Content => throw new InvalidOperationException("Result does not have a Content property");
        public StreamExpression ContentStream => throw new InvalidOperationException("Result does not have a ContentStream property");

        public static ResultExpression FromResponse(PipelineResponseExpression response)
            => new(InvokeStatic(nameof(Result.FromResponse), response));

        public static ResultExpression FromValue(ValueExpression value, PipelineResponseExpression response)
            => new(InvokeStatic(nameof(Result.FromValue), value, response));

        public static ResultExpression FromValue(CSharpType explicitValueType, ValueExpression value, PipelineResponseExpression response)
            => new(new InvokeStaticMethodExpression(typeof(Result), nameof(Result.FromValue), new[] { value, response }, new[] { explicitValueType }));

        public ResultExpression FromValue(ValueExpression value)
            => new(new InvokeStaticMethodExpression(typeof(Result), nameof(Result.FromValue), new[] { value, this }));

        public ResultExpression FromValue(CSharpType explicitValueType, ValueExpression value)
            => new(new InvokeStaticMethodExpression(typeof(Result), nameof(Result.FromValue), new[] { value, this }, new[] { explicitValueType }));

        public PipelineResponseExpression GetRawResponse() => new(Invoke(nameof(Result<object>.GetRawResponse)));
    }
}
