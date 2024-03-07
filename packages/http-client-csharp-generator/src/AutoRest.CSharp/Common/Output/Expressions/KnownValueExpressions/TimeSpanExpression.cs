// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record TimeSpanExpression(ValueExpression Untyped) : TypedValueExpression<TimeSpan>(Untyped)
    {
        public StringExpression ToString(string? format) => new(Invoke(nameof(TimeSpan.ToString), new[] { Literal(format) }));

        public static TimeSpanExpression FromSeconds(ValueExpression value) => new(InvokeStatic(nameof(TimeSpan.FromSeconds), value));
    }
}
