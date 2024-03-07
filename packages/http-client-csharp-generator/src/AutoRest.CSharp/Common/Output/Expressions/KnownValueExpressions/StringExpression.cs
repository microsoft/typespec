// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record StringExpression(ValueExpression Untyped) : TypedValueExpression<string>(Untyped)
    {
        public ValueExpression Length => Property(nameof(string.Length));

        public static BoolExpression Equals(StringExpression left, StringExpression right, StringComparison comparisonType)
            => new(InvokeStatic(nameof(string.Equals), new[] { left, right, FrameworkEnumValue(comparisonType) }));

        public static StringExpression Format(StringExpression format, params ValueExpression[] args)
            => new(new InvokeStaticMethodExpression(typeof(string), nameof(string.Format), args.Prepend(format).ToArray()));
    }
}
