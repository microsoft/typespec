// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using Azure;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record NullableResponseExpression(ValueExpression Untyped) : TypedValueExpression<NullableResponse<object>>(Untyped)
    {
        public BoolExpression HasValue => new(Property(nameof(NullableResponse<object>.HasValue)));
        public ValueExpression Value => Property(nameof(NullableResponse<object>.Value));
        public ResponseExpression GetRawResponse() => new(Invoke(nameof(NullableResponse<object>.GetRawResponse)));
    }
}
