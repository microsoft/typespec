// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record LongExpression(ValueExpression Untyped) : TypedValueExpression<long>(Untyped)
    {
        public StringExpression InvokeToString(ValueExpression formatProvider)
            => new(Invoke(nameof(long.ToString), formatProvider));

        public static LongExpression Parse(StringExpression value, ValueExpression formatProvider)
            => new(new InvokeStaticMethodExpression(typeof(long), nameof(long.Parse), new[] { value, formatProvider }));
    }
}
