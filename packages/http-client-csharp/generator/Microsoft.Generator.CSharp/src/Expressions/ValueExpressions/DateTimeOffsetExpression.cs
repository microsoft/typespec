// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DateTimeOffsetExpression(ValueExpression Untyped) : TypedValueExpression<DateTimeOffset>(Untyped), ITypedValueExpressionFactory<DateTimeOffsetExpression>
    {
        public static DateTimeOffsetExpression Now => new(StaticProperty(nameof(DateTimeOffset.Now)));
        public static DateTimeOffsetExpression UtcNow => new(StaticProperty(nameof(DateTimeOffset.UtcNow)));

        public static DateTimeOffsetExpression FromUnixTimeSeconds(ValueExpression expression)
            => new(InvokeStatic(nameof(DateTimeOffset.FromUnixTimeSeconds), expression));

        public StringExpression InvokeToString(StringExpression format, ValueExpression formatProvider)
            => new(Invoke(nameof(DateTimeOffset.ToString), new[] { format, formatProvider }));

        public LongExpression ToUnixTimeSeconds()
            => new(Invoke(nameof(DateTimeOffset.ToUnixTimeSeconds)));

        public DateTimeOffsetExpression ToUniversalTime()
            => new(Invoke(nameof(DateTimeOffset.ToUniversalTime)));

        public static DateTimeOffsetExpression Parse(string s) => Parse(Snippets.Literal(s));

        public static DateTimeOffsetExpression Parse(ValueExpression value)
            => new(InvokeStatic(nameof(DateTimeOffset.Parse), value));

        public static DateTimeOffsetExpression Parse(ValueExpression value, ValueExpression formatProvider, ValueExpression style)
            => new(InvokeStatic(nameof(DateTimeOffset.Parse), new[] { value, formatProvider, style }));

        static DateTimeOffsetExpression ITypedValueExpressionFactory<DateTimeOffsetExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
