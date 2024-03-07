// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using Azure;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record ResponseExpression(ValueExpression Untyped) : TypedValueExpression<Response>(Untyped)
    {
        public ValueExpression Status => Property(nameof(Response.Status));

        public StreamExpression ContentStream => new(Property(nameof(Response.ContentStream)));
        public BinaryDataExpression Content => new(Property(nameof(Response.Content)));

        public static NullableResponseExpression FromValue(ValueExpression value, ResponseExpression rawResponse)
            => new(new InvokeStaticMethodExpression(typeof(Response), nameof(Response.FromValue), new[] { value, rawResponse }));

        public static NullableResponseExpression FromValue(CSharpType explicitValueType, ValueExpression value, ResponseExpression rawResponse)
            => new(new InvokeStaticMethodExpression(typeof(Response), nameof(Response.FromValue), new[] { value, rawResponse }, new[] { explicitValueType }));
    }
}
