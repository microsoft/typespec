// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record TimeSpanExpression(ValueExpression Untyped) : TypedValueExpression<TimeSpan>(Untyped), ITypedValueExpressionFactory<TimeSpanExpression>
    {
        public StringExpression InvokeToString(string? format) => new(Invoke(nameof(TimeSpan.ToString), new[] { Snippets.Literal(format) }));
        public StringExpression InvokeToString(ValueExpression format, ValueExpression formatProvider)
            => new(Invoke(nameof(TimeSpan.ToString), new[] { format, formatProvider }));

        public static TimeSpanExpression FromSeconds(ValueExpression value) => new(InvokeStatic(nameof(TimeSpan.FromSeconds), value));

        public static TimeSpanExpression ParseExact(ValueExpression value, ValueExpression format, ValueExpression formatProvider)
            => new(new InvokeStaticMethodExpression(typeof(TimeSpan), nameof(TimeSpan.ParseExact), new[] { value, format, formatProvider }));

        static TimeSpanExpression ITypedValueExpressionFactory<TimeSpanExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
