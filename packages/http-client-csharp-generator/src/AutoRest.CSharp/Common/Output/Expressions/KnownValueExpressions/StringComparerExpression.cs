// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record StringComparerExpression(ValueExpression Untyped) : TypedValueExpression<StringComparer>(Untyped)
    {
        public BoolExpression Equals(StringExpression left, StringExpression right) => new(Invoke(nameof(StringComparer.Equals), left, right));

        public static StringComparerExpression Ordinal => new(StaticProperty(nameof(StringComparer.Ordinal)));
        public static StringComparerExpression OrdinalIgnoreCase => new(StaticProperty(nameof(StringComparer.OrdinalIgnoreCase)));
    }
}
