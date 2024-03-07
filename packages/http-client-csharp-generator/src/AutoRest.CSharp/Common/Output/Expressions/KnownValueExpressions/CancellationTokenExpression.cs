// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record CancellationTokenExpression(ValueExpression Untyped) : TypedValueExpression<CancellationToken>(Untyped)
    {
        public BoolExpression CanBeCanceled => new(Property(nameof(CancellationToken.CanBeCanceled)));
    }
}
